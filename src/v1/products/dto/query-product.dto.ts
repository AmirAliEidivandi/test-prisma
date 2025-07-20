import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ProductStatus } from '../enums/product-status.enum';

export class QueryProductDto {
  @IsOptional()
  @IsString({ message: 'validation.constraints.isString' })
  search?: string;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'validation.constraints.isEnum' })
  status?: ProductStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.constraints.isInt' })
  @Min(0, { message: 'validation.constraints.min' })
  page?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.constraints.isInt' })
  @Min(1, { message: 'validation.constraints.min' })
  limit?: number = 10;
}
