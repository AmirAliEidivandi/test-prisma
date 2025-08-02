import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryUserDto {
  @IsOptional()
  @IsString({ message: 'validation.constraints.isString' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'validation.constraints.isString' })
  sort?: string;

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
