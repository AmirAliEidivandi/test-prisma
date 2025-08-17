import { AiModel } from '@enums/model.enum';
import { Controller, Get, Query } from '@nestjs/common';

@Controller('v1/chats')
export class ChatsController {
  @Get('models')
  async listModels(@Query('search') search?: string) {
    // Replace remote list with curated enum
    const curated = Object.values(AiModel)
      .filter((id) =>
        search ? id.toLowerCase().includes(search.toLowerCase()) : true,
      )
      .map((id) => ({ id }));
    return { items: curated };
  }
}
