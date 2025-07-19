import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    isArray: true,
    description: 'The data',
  })
  data: T[];

  @ApiProperty({
    type: Number,
    description: 'The count number of items',
  })
  count: number;
}
