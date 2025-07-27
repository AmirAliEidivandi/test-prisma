import { IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  firstName: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  lastName: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  nationalCode: string;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsEmail({}, { message: 'validation.constraints.isEmail' })
  email: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  jobPosition: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  phone: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  address: string;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsDateString({}, { message: 'validation.constraints.isDateString' })
  birthDate: Date;
}
