import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '../enums/product-status.enum';

export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: 'validation.constraints.isString' })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'validation.constraints.isNumber' })
  price?: number;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'validation.constraints.isEnum' })
  status?: ProductStatus;
}
