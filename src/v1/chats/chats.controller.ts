import { AiModel } from '@enums/model.enum';
import { Controller, Get } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';

@Controller('v1/chats')
export class ChatsController {
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
