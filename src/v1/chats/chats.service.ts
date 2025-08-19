import { Injectable } from '@nestjs/common';
import { PrismaService } from '@services/prisma/prisma.service';
import { decrypt } from '@utils/encryption.util';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateChatAnonymous(payload: string) {
    const { chat_id, profile_id, kid } = decrypt(payload) as {
      chat_id: string;
      profile_id: string;
      kid: string;
    };

    console.log(chat_id, profile_id, kid);

    const chat = await this.prisma.chat.findUnique({
      where: { id: chat_id },
      include: { user: true },
    });
    if (!chat) return;

    // Try to find an existing real user by provided identifiers
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ profile_id }, { kid }],
      },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== (chat as any).user_id) {
      // Reassign chat ownership to the existing real user
      const oldUserId = (chat as any).user_id ?? chat.user.id;
      await this.prisma.chat.update({
        where: { id: chat_id },
        data: { user_id: existingUser.id },
      });
      // Clean up the old anonymous user if it has no other chats
      const remaining = await this.prisma.chat.count({
        where: { user_id: oldUserId, deleted_at: null },
      });
      if (remaining === 0) {
        await this.prisma.user.update({
          where: { id: oldUserId },
          data: { deleted_at: new Date() as any },
        });
      }
      return;
    }

    // Otherwise, upgrade the current (likely anonymous) user to a real user
    await this.prisma.user.update({
      where: { id: chat.user_id },
      data: {
        kid,
        profile_id,
      },
    });
  }
}
