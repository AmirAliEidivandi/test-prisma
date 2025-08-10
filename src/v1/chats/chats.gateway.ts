import { WsAuthGuard } from '@guards/ws-auth.guard';
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
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service';

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
    private readonly chatsService: ChatsService,
    private readonly prisma: PrismaService,
    private readonly openai: OpenAiService,
  ) {}

  // Client emits 'send_message' with payload: { chatId?: string, model: string, content: string }
  @SubscribeMessage('send_message')
  @UseGuards(WsAuthGuard)
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      chatId?: string;
      model: string;
      content: string;
      temperature?: number;
    },
  ) {
    const { chatId, model, content, temperature } = payload;
    // 1) Persist user's message immediately and emit back so user sees it
    let chat = null as null | { id: string; model: string; title: string };

    if (chatId) {
      chat = await this.prisma.chat.findFirst({
        where: {
          id: chatId,
          deletedAt: null,
          userId: (client as any).data.authUser.id,
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
          user: { connect: { id: (client as any).data.authUser.id } },
        },
        select: { id: true, model: true, title: true },
      });
      client.emit('chat_created', {
        chatId: chat.id,
        title: chat.title,
        model,
      });
    }

    const message = await this.prisma.message.create({
      data: {
        chatId: chat.id,
        role: MessageRole.USER,
        content,
        order: await this.nextOrder(chat.id),
      },
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true,
        chatId: true,
      },
    });

    // Emit user's message immediately
    this.server.to(client.id).emit('message_created', message);

    // 2) Stream assistant response via OpenAI
    const history = await this.prisma.message.findMany({
      where: { chatId: chat.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
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
            .emit('assistant_typing', { chatId: chat.id });
        },
        onDelta: (delta) => {
          fullText += delta;
          this.server.to(client.id).emit('assistant_delta', {
            chatId: chat.id,
            delta,
          });
        },
        onComplete: async () => {
          const saved = await this.prisma.message.create({
            data: {
              chatId: chat.id,
              role: MessageRole.ASSISTANT,
              content: fullText,
              order: await this.nextOrder(chat.id),
            },
            select: {
              id: true,
              content: true,
              role: true,
              createdAt: true,
              chatId: true,
            },
          });
          assistantMessageId = saved.id;
          this.server.to(client.id).emit('assistant_complete', {
            ...saved,
          });
        },
        onError: (error) => {
          this.server.to(client.id).emit('assistant_error', {
            chatId: chat?.id,
            error: (error as any)?.message || 'AI error',
          });
        },
      },
    });

    return { ok: true, chatId: chat.id, assistantMessageId };
  }

  @SubscribeMessage('list_messages')
  @UseGuards(WsAuthGuard)
  async onListMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; page?: number; limit?: number },
  ) {
    const { chatId } = payload;
    const page = Number.isInteger(payload?.page) ? (payload.page as number) : 0;
    const limit = Number.isInteger(payload?.limit)
      ? (payload.limit as number)
      : 20;
    const skip = page * limit;
    const ownership = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: (client as any).data.authUser.id,
        deletedAt: null,
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
      this.server.to(client.id).emit('messages_list', { chatId, ...empty });
      return { chatId, count: 0 };
    }
    const totalCount = await this.prisma.message.count({
      where: { chatId, deletedAt: null },
    });
    const messages = await this.prisma.message.findMany({
      where: { chatId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true,
        chatId: true,
      },
    });
    const envelope = this.buildPaginatedEnvelope(
      messages,
      totalCount,
      page,
      limit,
      'Messages listed',
    );
    this.server.to(client.id).emit('messages_list', { chatId, ...envelope });
    return { chatId, count: messages.length };
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
    const where = { userId, deletedAt: null } as const;
    const totalCount = await this.prisma.chat.count({ where });
    const chats = await this.prisma.chat.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true,
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
      where: { chatId, deletedAt: null },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? 0) + 1;
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
}
