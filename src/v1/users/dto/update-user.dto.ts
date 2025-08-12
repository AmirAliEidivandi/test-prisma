import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  first_name?: string;

  @IsOptional()
  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  last_name?: string;

  @IsOptional()
  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  job_position?: string;
}
