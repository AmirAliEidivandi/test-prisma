import { ApiProperty } from '@nestjs/swagger';
import { ResponseUserDto } from '@users/dto/response-user.dto';

export class ResponseProductDto {
  @ApiProperty({
    description: 'The id of the product',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'The name of the product',
    example: 'Product 1',
    required: true,
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'The price of the product',
    example: 100,
    required: true,
    type: Number,
  })
  price: number;

  @ApiProperty({
    description: 'The status of the product',
    example: 'ACTIVE',
    required: true,
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'The user id of the product',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'The user of the product',
    example: ResponseUserDto,
    required: true,
    type: ResponseUserDto,
  })
  user: ResponseUserDto;
}
