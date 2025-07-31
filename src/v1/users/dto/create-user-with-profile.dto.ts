import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserWithProfileDto {
  // Profile fields
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
    type: String,
  })
  firstName?: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
    type: String,
  })
  lastName?: string;

  @ApiProperty({
    description: 'The national code of the user',
    example: '1234567890',
    type: String,
  })
  nationalCode?: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
    type: String,
  })
  email?: string;

  @ApiProperty({
    description: 'The birth date of the user',
    example: '1990-01-01',
    type: String,
  })
  birthDate?: string;

  // Local user fields
  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @ApiProperty({
    description: 'The job position of the user',
    example: 'Software Engineer',
    required: true,
    type: String,
  })
  jobPosition: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @ApiProperty({
    description: 'The phone number of the user',
    example: '09123456789',
    required: true,
    type: String,
  })
  phone: string;

  @IsString({ message: 'validation.constraints.isString' })
  @IsNotEmpty({ message: 'validation.constraints.isNotEmpty' })
  @ApiProperty({
    description: 'The address of the user',
    example: '123 Main St, Anytown, USA',
    required: true,
    type: String,
  })
  address: string;
}
