import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { ProductStatus } from '../enums/product-status.enum';

export class CreateProductDto {
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsString({ message: 'validation.constraints.isString' })
  @ApiProperty({
    description: 'The name of the product',
    example: 'Product 1',
    required: true,
    type: String,
    minLength: 3,
    maxLength: 255,
  })
  name: string;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsNumber({}, { message: 'validation.constraints.isNumber' })
  @ApiProperty({
    description: 'The price of the product',
    example: 100,
    required: true,
    type: Number,
  })
  price: number;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsUUID(4, { message: 'validation.constraints.isUUID' })
  @ApiProperty({
    description: 'The user ID of the product',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
    type: String,
  })
  userId: string;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsEnum(ProductStatus, { message: 'validation.constraints.isEnum' })
  @ApiProperty({
    description: 'The status of the product',
    example: ProductStatus.ACTIVE,
    required: true,
    type: String,
  })
  status: ProductStatus;
}
