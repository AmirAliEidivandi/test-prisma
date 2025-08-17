import { MessagesModule } from '@messages/messages.module';
import { Module } from '@nestjs/common';
import { KafkaModule } from '@services/kafka/kafka.module';
import { OpenAiService } from '@services/openai/openai.service';
import { TokenizerService } from '@services/openai/tokenizer.service';
import { PrismaModule } from '@services/prisma/prisma.module';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { ChatsService } from './chats.service';

@Module({
  imports: [PrismaModule, MessagesModule, KafkaModule],
  providers: [ChatsService, ChatsGateway, OpenAiService, TokenizerService],
  controllers: [ChatsController],
})
export class ChatsModule {}
