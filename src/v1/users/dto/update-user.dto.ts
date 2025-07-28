import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  lastName?: string;
}
