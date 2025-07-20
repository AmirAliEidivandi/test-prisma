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
  name: string;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsNumber({}, { message: 'validation.constraints.isNumber' })
  price: number;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsUUID(4, { message: 'validation.constraints.isUUID' })
  userId: string;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsEnum(ProductStatus, { message: 'validation.constraints.isEnum' })
  status: ProductStatus;
}
