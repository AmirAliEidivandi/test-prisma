import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

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
  @IsPhoneNumber('IR', { message: 'validation.constraints.isPhoneNumber' })
  @MinLength(11, { message: 'validation.constraints.minLength' })
  @MaxLength(11, { message: 'validation.constraints.maxLength' })
  @Matches(/^09\d{9}$/, { message: 'validation.constraints.phoneNumber' })
  phone: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  address: string;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsDateString({}, { message: 'validation.constraints.isDateString' })
  birthDate: Date;
}
