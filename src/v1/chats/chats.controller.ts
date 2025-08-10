import { Controller, Get, Query } from '@nestjs/common';
import { OpenAiService } from '@services/openai/openai.service';

@Controller('v1/chats')
export class ChatsController {
  constructor(private readonly openai: OpenAiService) {}

  @Get('models')
  async listModels(@Query('search') search?: string) {
    const models = await this.openai.listModels({ search });
    return { items: models };
  }
}
