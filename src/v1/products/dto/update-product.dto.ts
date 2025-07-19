import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '../enums/product-status.enum';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
