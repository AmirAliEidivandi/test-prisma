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
import {
  ChatMessageForAI,
  OpenAiService,
} from '@services/openai/openai.service';
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
      // Enforce total of 10 interactions (5 user + 5 ai)
      const current = await this.redis.getAnonUsage(anonId);
      if (current >= 10) {
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
    // 1) Persist user's message immediately and emit back so user sees it
    let chat = null as null | { id: string; model: string; title: string };

    if (chat_id) {
      chat = await this.prisma.chat.findFirst({
        where: {
          id: chat_id,
          deleted_at: null,
          user_id: ownerUserId,
        },
        select: { id: true, model: true, title: true },
      });
    }

    // Create chat if missing
    if (!chat) {
      const title = this.openai.generateTitleFromPrompt(content);
      chat = await this.prisma.chat.create({
        data: {
          title,
          model,
          user: { connect: { id: ownerUserId! } },
        },
        select: { id: true, model: true, title: true },
      });
      client.emit('chat_created', {
        chat_id: chat.id,
        title: chat.title,
        model,
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

    // 2) Stream assistant response via OpenAI
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
          assistantMessageId = saved.id;
          this.server.to(client.id).emit('assistant_complete', {
            ...saved,
          });
        },
        onError: (error) => {
          this.server.to(client.id).emit('assistant_error', {
            chat_id: chat?.id,
            error: (error as any)?.message || 'AI error',
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
