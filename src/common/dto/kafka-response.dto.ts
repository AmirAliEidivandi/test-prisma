import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ValidateNested } from 'class-validator';

export abstract class KafkaResponse<T> {
  @ApiProperty({
    type: Boolean,
    description: 'Was the action successful?',
    required: true,
    nullable: false,
  })
  success: boolean;

  @ApiProperty({
    type: Number,
    description: 'Data array length',
    required: true,
    nullable: false,
  })
  count: number;

  @ApiProperty({
    type: String,
    description: 'Response message',
    required: true,
    nullable: false,
  })
  msg: string;

  @ApiProperty({
    type: Array<T>,
    description: 'Data array',
    required: true,
    nullable: false,
  })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  abstract data: T[];
}
