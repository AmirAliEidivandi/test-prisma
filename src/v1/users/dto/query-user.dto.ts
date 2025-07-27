import { IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryUserDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 0;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}
