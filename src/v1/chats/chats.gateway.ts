import { getPricing } from '@config/pricing/pricing.config';
import { WsAuthGuard } from '@guards/ws-auth.guard';
import { WsOptionalAuthGuard } from '@guards/ws-optional-auth.guard';
import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageRole } from '@prisma/client';
import { WalletKafkaService } from '@services/kafka/pay/wallet-kafka.service';
import {
  ChatMessageForAI,
  OpenAiService,
} from '@services/openai/openai.service';
import { TokenizerService } from '@services/openai/tokenizer.service';
import { PrismaService } from '@services/prisma/prisma.service';
import { RedisService } from '@services/redis/redis.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'chats',
  cors: {
    origin: '*',
  },
})
export class ChatsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAiService,
    private readonly redis: RedisService,
    private readonly walletKafka: WalletKafkaService,
    private readonly tokenizer: TokenizerService,
  ) {}

  // Client emits 'send_message' with payload: { chatId?: string, model: string, content: string }
  @SubscribeMessage('send_message')
  @UseGuards(WsOptionalAuthGuard)
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      chat_id?: string;
      model: string;
      content: string;
      temperature?: number;
    },
  ) {
    const { chat_id, model, content, temperature } = payload;
    const isAnonymous =
      (client as any).data?.isAnonymous === true ||
      !(client as any).data?.authUser;
    let ownerUserId: string | null = null;
    let anonId: string | null = null;
    if (isAnonymous) {
      anonId = this.getOrSetAnonId(client);
      // Enforce total of 200 interactions (100 user + 100 ai)
      const current = await this.redis.getAnonUsage(anonId);
      if (current >= 200) {
        this.server.to(client.id).emit('assistant_error', {
          chat_id: chat_id || null,
          error: 'Please login to continue. Free limit reached.',
          code: 'ANON_LIMIT_REACHED',
        });
        return { ok: false, reason: 'ANON_LIMIT_REACHED' };
      }
      const anonUser = await this.getOrCreateAnonUser(anonId);
      ownerUserId = anonUser.id;
    } else {
      ownerUserId = (client as any).data.authUser.id;
    }
    // Pre-determine model to use
    let chat = null as null | { id: string; model: string; title?: string };
    let modelToUse = model;
    if (chat_id) {
      const existing = await this.prisma.chat.findFirst({
        where: { id: chat_id, deleted_at: null, user_id: ownerUserId },
        select: { id: true, model: true },
      });
      if (!existing) {
        this.server.to(client.id).emit('assistant_error', {
          chat_id: chat_id,
          error: 'Chat not found or not accessible',
          code: 'CHAT_NOT_FOUND',
        });
        return { ok: false, reason: 'CHAT_NOT_FOUND' };
      }
      chat = existing as any;
      modelToUse = existing.model;
    }

    // 1) Pre-check wallet balance (only for authenticated users) BEFORE creating chat/message
    if (!isAnonymous) {
      const pricing = getPricing(modelToUse);
      // cost for user tokens
      const userTokens = this.tokenizer.countTokens(content);
      const userCost = pricing?.user_token_cost_per_1k
        ? Math.ceil((userTokens * pricing.user_token_cost_per_1k) / 1000)
        : 0;
      // prehold assistant cost using default prehold tokens
      const preholdTokens = Number(
        process.env.PRICING_ASSISTANT_PREHOLD_TOKENS ?? 500,
      );
      const assistantPreCost =
        Math.ceil(Math.max(1, preholdTokens) / 1000) *
        (pricing?.assistant_token_cost_per_1k ?? 0);
      const required = userCost + assistantPreCost;
      try {
        const wallet = await this.walletKafka.getWalletByProfileId(
          (client as any).data.authUser.profile_id,
        );
        if (
          !wallet ||
          typeof wallet.balance !== 'number' ||
          wallet.balance < required
        ) {
          this.server.to(client.id).emit('assistant_error', {
            chat_id: chat_id || null,
            error: 'Insufficient wallet balance',
            code: 'INSUFFICIENT_BALANCE',
          });
          return { ok: false, reason: 'INSUFFICIENT_BALANCE' };
        }
      } catch (e) {
        this.server.to(client.id).emit('assistant_error', {
          chat_id: chat_id || null,
          error: 'Wallet check failed',
          code: 'WALLET_CHECK_FAILED',
        });
        return { ok: false, reason: 'WALLET_CHECK_FAILED' };
      }
    }

    // 2) Now create chat if missing (use heuristic local title to avoid AI cost)
    if (!chat) {
      const title = this.generateHeuristicTitle(content);
      chat = await this.prisma.chat.create({
        data: {
          title,
          model: modelToUse,
          user: { connect: { id: ownerUserId! } },
        },
        select: { id: true, model: true, title: true },
      });
      client.emit('chat_created', {
        chat_id: chat.id,
        title: chat.title,
        model: modelToUse,
      });
    }

    const message = await this.prisma.message.create({
      data: {
        chat_id: chat.id,
        role: MessageRole.USER,
        content,
        order: await this.nextOrder(chat.id),
      },
      select: {
        id: true,
        content: true,
        role: true,
        created_at: true,
        chat_id: true,
      },
    });

    // Increment usage for anonymous on user message
    if (isAnonymous && anonId) {
      await this.redis.incrAnonUsage(anonId);
      await this.emitUsageInfo(client);
    }

    // Emit user's message immediately
    this.server.to(client.id).emit('message_created', message);

    // Debit #1: user tokens cost (authenticated users)
    if (!isAnonymous) {
      const pricing = getPricing(chat.model);
      if (pricing?.user_token_cost_per_1k) {
        const userTokens = this.tokenizer.countTokens(content);
        const userCost = Math.ceil(
          (userTokens * pricing.user_token_cost_per_1k) / 1000,
        );
        if (userCost > 0) {
          try {
            await this.walletKafka.debitWallet({
              profile_id: (client as any).data.authUser.profile_id,
              amount: userCost,
              reason: 'AI_CHAT',
              currency: 'IRT',
              metadata: { chat_id: chat.id, userTokens, part: 'user' },
            });
          } catch (e) {}
        }
      }
    }

    // (Wallet pre-check already done above)

    // 3) Stream assistant response via OpenAI
    const history = await this.prisma.message.findMany({
      where: { chat_id: chat.id, deleted_at: null },
      orderBy: { created_at: 'asc' },
      select: { role: true, content: true },
    });

    const mapped = history.map((m) => ({
      role: m.role === 'USER' ? 'user' : 'assistant',
      content: m.content,
    }));

    let assistantMessageId: string | undefined;
    let fullText = '';

    await this.openai.streamChatCompletion({
      model: chat.model,
      messages: mapped as ChatMessageForAI[],
      temperature,
      handler: {
        onStart: () => {
          // Notify client that streaming is starting
          this.server
            .to(client.id)
            .emit('assistant_typing', { chat_id: chat.id });
        },
        onDelta: (delta) => {
          fullText += delta;
          this.server.to(client.id).emit('assistant_delta', {
            chat_id: chat.id,
            delta,
          });
        },
        onComplete: async () => {
          const saved = await this.prisma.message.create({
            data: {
              chat_id: chat.id,
              role: MessageRole.ASSISTANT,
              content: fullText,
              order: await this.nextOrder(chat.id),
            },
            select: {
              id: true,
              content: true,
              role: true,
              created_at: true,
              chat_id: true,
            },
          });
          if (isAnonymous && anonId) {
            await this.redis.incrAnonUsage(anonId);
            await this.emitUsageInfo(client);
          }

          // Debit #2: assistant tokens cost after completion
          if (!isAnonymous) {
            const pricing = getPricing(chat.model);
            if (pricing) {
              const assistantTokens = this.tokenizer.countTokens(fullText);
              const assistantCost = Math.ceil(
                (assistantTokens * (pricing.assistant_token_cost_per_1k ?? 0)) /
                  1000,
              );
              if (assistantCost > 0) {
                try {
                  await this.walletKafka.debitWallet({
                    profile_id: (client as any).data.authUser.profile_id,
                    amount: assistantCost,
                    reason: 'AI_CHAT',
                    currency: 'IRT',
                    metadata: {
                      chat_id: chat.id,
                      assistantTokens,
                      part: 'assistant',
                    },
                  });
                } catch (e) {
                  // Optional: emit warning
                }
              }
            }
          }
          assistantMessageId = saved.id;
          this.server.to(client.id).emit('assistant_complete', {
            ...saved,
          });
        },
        onError: async (error) => {
          const e: any = error || {};
          // Rollback: remove the freshly created user message and chat if empty
          try {
            await this.prisma.message.delete({ where: { id: message.id } });
            const remaining = await this.prisma.message.count({
              where: { chat_id: chat!.id, deleted_at: null },
            });
            if (remaining === 0) {
              await this.prisma.chat.update({
                where: { id: chat!.id },
                data: { deleted_at: new Date() as any },
              });
            }
          } catch {}
          this.server.to(client.id).emit('assistant_error', {
            chat_id: chat?.id,
            error: e.message || 'AI error',
            provider: e.provider,
            status: e.status,
            code: e.code,
          });
        },
      },
    });

    return { ok: true, chat_id: chat.id, assistantMessageId };
  }

  @SubscribeMessage('usage_info')
  @UseGuards(WsOptionalAuthGuard)
  async onUsageInfo(@ConnectedSocket() client: Socket) {
    const info = await this.computeUsageInfo(client);
    this.server.to(client.id).emit('usage_info', info);
    return info;
  }

  @SubscribeMessage('regenerate')
  @UseGuards(WsOptionalAuthGuard)
  async onRegenerate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      chat_id: string;
      assistant_message_id: string;
      temperature?: number;
      replace?: boolean;
    },
  ) {
    const { chat_id, assistant_message_id, temperature } = payload;
    const isAnonymous =
      (client as any).data?.isAnonymous === true ||
      !(client as any).data?.authUser;

    // Resolve owner
    let ownerUserId: string | null = null;
    let anonId: string | null = null;
    if (isAnonymous) {
      anonId = this.getOrSetAnonId(client);
      const current = await this.redis.getAnonUsage(anonId);
      if (current >= 200) {
        this.server.to(client.id).emit('assistant_error', {
          chat_id,
          error: 'Please login to continue. Free limit reached.',
          code: 'ANON_LIMIT_REACHED',
        });
        return { ok: false, reason: 'ANON_LIMIT_REACHED' };
      }
      const anonUser = await this.getOrCreateAnonUser(anonId);
      ownerUserId = anonUser.id;
    } else {
      ownerUserId = (client as any).data.authUser.id;
    }

    // Check chat ownership
    const chat = await this.prisma.chat.findFirst({
      where: { id: chat_id, deleted_at: null, user_id: ownerUserId },
      select: { id: true, model: true },
    });
    if (!chat) {
      this.server.to(client.id).emit('assistant_error', {
        chat_id,
        error: 'Chat not found or not accessible',
        code: 'CHAT_NOT_FOUND',
      });
      return { ok: false, reason: 'CHAT_NOT_FOUND' };
    }

    // Target assistant message
    const target = await this.prisma.message.findFirst({
      where: {
        id: assistant_message_id,
        chat_id,
        role: 'ASSISTANT',
        deleted_at: null,
      },
      select: { id: true, created_at: true },
    });
    if (!target) {
      this.server.to(client.id).emit('assistant_error', {
        chat_id,
        error: 'Assistant message not found',
        code: 'MSG_NOT_FOUND',
      });
      return { ok: false, reason: 'MSG_NOT_FOUND' };
    }

    // Pre-check wallet (assistant prehold only)
    if (!isAnonymous) {
      const pricing = getPricing(chat.model);
      const preholdTokens = Number(
        process.env.PRICING_ASSISTANT_PREHOLD_TOKENS ?? 500,
      );
      const assistantPreCost =
        Math.ceil(Math.max(1, preholdTokens) / 1000) *
        (pricing?.assistant_token_cost_per_1k ?? 0);
      try {
        const wallet = await this.walletKafka.getWalletByProfileId(
          (client as any).data.authUser.profile_id,
        );
        if (
          !wallet ||
          typeof wallet.balance !== 'number' ||
          wallet.balance < assistantPreCost
        ) {
          this.server.to(client.id).emit('assistant_error', {
            chat_id,
            error: 'Insufficient wallet balance',
            code: 'INSUFFICIENT_BALANCE',
          });
          return { ok: false, reason: 'INSUFFICIENT_BALANCE' };
        }
      } catch (e) {
        this.server.to(client.id).emit('assistant_error', {
          chat_id,
          error: 'Wallet check failed',
          code: 'WALLET_CHECK_FAILED',
        });
        return { ok: false, reason: 'WALLET_CHECK_FAILED' };
      }
    }

    // Build history up to target (exclude the target assistant response)
    const all = await this.prisma.message.findMany({
      where: { chat_id, deleted_at: null },
      orderBy: { created_at: 'asc' },
      select: { id: true, role: true, content: true },
    });
    const idx = all.findIndex((m) => m.id === assistant_message_id);
    const history = idx > -1 ? all.slice(0, idx) : all;
    const mapped = history.map((m) => ({
      role: m.role === 'USER' ? 'user' : 'assistant',
      content: m.content,
    }));

    // Notify client
    this.server.to(client.id).emit('assistant_regenerating', {
      chat_id,
      replace_of_message_id: assistant_message_id,
    });

    let fullText = '';
    await this.openai.streamChatCompletion({
      model: chat.model,
      messages: mapped as ChatMessageForAI[],
      temperature,
      handler: {
        onStart: () => {},
        onDelta: (delta) => {
          fullText += delta;
          this.server.to(client.id).emit('assistant_delta', {
            chat_id,
            delta,
            replace_of_message_id: assistant_message_id,
          });
        },
        onComplete: async () => {
          const saved = await this.prisma.message.create({
            data: {
              chat_id,
              role: 'ASSISTANT',
              content: fullText,
              order: await this.nextOrder(chat_id),
              metadata: { regenerated_from: assistant_message_id },
            },
            select: {
              id: true,
              content: true,
              role: true,
              created_at: true,
              chat_id: true,
            },
          });

          // Anonymous quota
          if (isAnonymous && anonId) {
            await this.redis.incrAnonUsage(anonId);
            await this.emitUsageInfo(client);
          }

          // Debit assistant tokens
          if (!isAnonymous) {
            const pricing = getPricing(chat.model);
            const assistantTokens = this.tokenizer.countTokens(fullText);
            const assistantCost = Math.ceil(
              (assistantTokens * (pricing?.assistant_token_cost_per_1k ?? 0)) /
                1000,
            );
            if (assistantCost > 0) {
              try {
                await this.walletKafka.debitWallet({
                  profile_id: (client as any).data.authUser.profile_id,
                  amount: assistantCost,
                  reason: 'AI_CHAT',
                  metadata: {
                    chat_id,
                    assistantTokens,
                    part: 'assistant_regenerate',
                    replace_of_message_id: assistant_message_id,
                  },
                });
              } catch (e) {}
            }
          }

          this.server.to(client.id).emit('assistant_regenerated', {
            ...saved,
            replace_of_message_id: assistant_message_id,
          });
        },
        onError: (error) => {
          const e: any = error || {};
          this.server.to(client.id).emit('assistant_error', {
            chat_id,
            error: e.message || 'AI error',
            provider: e.provider,
            status: e.status,
            code: e.code,
          });
        },
      },
    });

    return { ok: true };
  }

  @SubscribeMessage('list_messages')
  @UseGuards(WsAuthGuard)
  async onListMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chat_id: string; page?: number; limit?: number },
  ) {
    const { chat_id } = payload;
    const page = Number.isInteger(payload?.page) ? (payload.page as number) : 0;
    const limit = Number.isInteger(payload?.limit)
      ? (payload.limit as number)
      : 20;
    const skip = page * limit;
    const ownership = await this.prisma.chat.findFirst({
      where: {
        id: chat_id,
        user_id: (client as any).data.authUser.id,
        deleted_at: null,
      },
      select: { id: true },
    });
    if (!ownership) {
      const empty = this.buildPaginatedEnvelope(
        [],
        0,
        page,
        limit,
        'Messages listed',
      );
      this.server.to(client.id).emit('messages_list', { chat_id, ...empty });
      return { chat_id, count: 0 };
    }
    const totalCount = await this.prisma.message.count({
      where: { chat_id, deleted_at: null },
    });
    const messages = await this.prisma.message.findMany({
      where: { chat_id, deleted_at: null },
      orderBy: { created_at: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        content: true,
        role: true,
        created_at: true,
        chat_id: true,
      },
    });
    const envelope = this.buildPaginatedEnvelope(
      messages,
      totalCount,
      page,
      limit,
      'Messages listed',
    );
    this.server.to(client.id).emit('messages_list', { chat_id, ...envelope });
    return { chat_id, count: messages.length };
  }

  @SubscribeMessage('list_chats')
  @UseGuards(WsAuthGuard)
  async onListChats(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload?: { page?: number; limit?: number },
  ) {
    const userId = (client as any).data.authUser.id;
    const page = Number.isInteger(payload?.page)
      ? (payload?.page as number)
      : 0;
    const limit = Number.isInteger(payload?.limit)
      ? (payload?.limit as number)
      : 20;
    const skip = page * limit;
    const where = { user_id: userId, deleted_at: null } as const;
    const totalCount = await this.prisma.chat.count({ where });
    const chats = await this.prisma.chat.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        model: true,
        created_at: true,
        updated_at: true,
      },
    });
    const envelope = this.buildPaginatedEnvelope(
      chats,
      totalCount,
      page,
      limit,
      'Chats listed',
    );
    this.server.to(client.id).emit('chats_list', envelope);
    return { count: chats.length };
  }

  private async nextOrder(chatId: string): Promise<number> {
    const last = await this.prisma.message.findFirst({
      where: { chat_id: chatId, deleted_at: null },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? 0) + 1;
  }

  private generateHeuristicTitle(prompt: string): string {
    const cleaned = (prompt || '').trim().replace(/\s+/g, ' ');
    if (!cleaned) return 'New Chat';
    const words = cleaned.split(' ').slice(0, 6);
    const title = words.join(' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  private getOrSetAnonId(client: Socket): string {
    const headerId = (client.handshake.headers['x-anon-id'] as string) || '';
    const cookieId = this.getCookie(client, 'anon_id');
    const existing = headerId || cookieId;
    if (existing) return existing;
    const ip = (client.handshake.address || '').replace(/\W/g, '');
    const ua = (
      (client.handshake.headers['user-agent'] as string) || ''
    ).replace(/\W/g, '');
    return `fp_${ip}_${ua}`.slice(0, 120);
  }

  private getCookie(client: Socket, name: string): string | null {
    const cookie = client.handshake.headers.cookie as string | undefined;
    if (!cookie) return null;
    const parts = cookie.split(';').map((c) => c.trim());
    for (const p of parts) {
      const [k, v] = p.split('=');
      if (k === name) return decodeURIComponent(v);
    }
    return null;
  }

  private async getOrCreateAnonUser(anonId: string): Promise<{ id: string }> {
    const kid = `ANON:${anonId}`;
    const existing = await this.prisma.user.findFirst({
      where: { kid, deleted_at: null },
      select: { id: true },
    });
    if (existing) return existing;
    const created = await this.prisma.user.create({
      data: {
        kid,
        profile_id: `anon:${anonId}`,
      },
      select: { id: true },
    });
    return created;
  }

  private buildPaginatedEnvelope<T>(
    items: T[],
    totalCount: number,
    page: number,
    limit: number,
    message = 'Listed successfully',
  ) {
    const totalPages = Math.ceil((totalCount || 0) / (limit || 1));
    return {
      success: true,
      message,
      data: items,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages - 1,
        hasPreviousPage: page > 0,
      },
      timestamp: new Date().toISOString(),
      statusCode: 200,
    };
  }

  private async computeUsageInfo(client: Socket): Promise<{
    used: number;
    limit: number | null;
    remaining: number | null;
    isAnonymous: boolean;
  }> {
    const isAnonymous =
      (client as any).data?.isAnonymous === true ||
      !(client as any).data?.authUser;
    if (!isAnonymous) {
      return { used: 0, limit: null, remaining: null, isAnonymous: false };
    }
    const anonId = this.getOrSetAnonId(client);
    const used = await this.redis.getAnonUsage(anonId);
    const limit = 10;
    const remaining = Math.max(0, limit - used);
    return { used, limit, remaining, isAnonymous: true };
  }

  private async emitUsageInfo(client: Socket) {
    const info = await this.computeUsageInfo(client);
    this.server.to(client.id).emit('usage_info', info);
  }
}
