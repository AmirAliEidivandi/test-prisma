import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';

@Module({
  providers: [ChatsService, ChatsGateway],
  controllers: [ChatsController]
})
export class ChatsModule {}
