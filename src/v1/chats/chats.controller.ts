import { KafkaServiceConstants } from '@constants/kafka.constants';
import { AiModel } from '@enums/model.enum';
import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Public } from 'nest-keycloak-connect';
import { ChatsService } from './chats.service';

@Controller('v1/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @EventPattern(KafkaServiceConstants.TOPICS.ANONYMOUS_USER)
  async updateChatAnonymous(@Payload() payload: string) {
    return this.chatsService.updateChatAnonymous(payload);
  }

  @Public()
  @Get('models')
  async listModels() {
    const models = Object.values(AiModel).map((name, index) => ({
      id: index + 1,
      name,
    }));

    return {
      items: models,
    };
  }
}
