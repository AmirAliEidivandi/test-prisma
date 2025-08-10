import { MessagesModule } from '@messages/messages.module';
import { Module } from '@nestjs/common';
import { OpenAiService } from '@services/openai/openai.service';
import { PrismaModule } from '@services/prisma/prisma.module';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { ChatsService } from './chats.service';

@Module({
  imports: [PrismaModule, MessagesModule],
  providers: [ChatsService, ChatsGateway, OpenAiService],
  controllers: [ChatsController],
})
export class ChatsModule {}
