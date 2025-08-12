import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
    required: true,
    type: String,
  })
  first_name: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
    required: true,
    type: String,
  })
  last_name: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @ApiProperty({
    description: 'The national code of the user',
    example: '1234567890',
    required: true,
    type: String,
  })
  national_code: string;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsEmail({}, { message: 'validation.constraints.isEmail' })
  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
    required: true,
    type: String,
  })
  email?: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @ApiProperty({
    description: 'The job position of the user',
    example: 'Software Engineer',
    required: true,
    type: String,
  })
  job_position: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsPhoneNumber('IR', { message: 'validation.constraints.isPhoneNumber' })
  @MinLength(11, { message: 'validation.constraints.minLength' })
  @MaxLength(11, { message: 'validation.constraints.maxLength' })
  @Matches(/^09\d{9}$/, { message: 'validation.constraints.phoneNumber' })
  @ApiProperty({
    description: 'The phone number of the user',
    example: '09123456789',
    required: true,
    type: String,
  })
  phone?: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @ApiProperty({
    description: 'The address of the user',
    example: '123 Main St, Anytown, USA',
    required: true,
    type: String,
  })
  address?: string;

  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @IsDateString({}, { message: 'validation.constraints.isDateString' })
  @ApiProperty({
    description: 'The birth date of the user',
    example: '1990-01-01',
    required: true,
    type: String,
  })
  birth_date?: string;
}
