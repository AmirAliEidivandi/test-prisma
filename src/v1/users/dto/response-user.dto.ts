import { ApiProperty } from '@nestjs/swagger';

export class ResponseUserDto {
  @ApiProperty({
    description: 'The id of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
    required: true,
    type: String,
  })
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
    required: true,
    type: String,
  })
  lastName: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
    required: true,
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'The national code of the user',
    example: '1234567890',
    required: true,
    type: String,
  })
  nationalCode: string;

  @ApiProperty({
    description: 'The birth date of the user',
    example: '1990-01-01',
    required: true,
    type: Date,
  })
  birthDate: Date;

  @ApiProperty({
    description: 'The job position of the user',
    example: 'Software Engineer',
    required: true,
    type: String,
  })
  jobPosition: string;

  @ApiProperty({
    description: 'The address of the user',
    example: '123 Main St, Anytown, USA',
    required: true,
    type: String,
  })
  address: string;

  @ApiProperty({
    description: 'The created at of the user',
    example: '2021-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The updated at of the user',
    example: '2021-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'The deleted at of the user',
    example: '2021-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  deletedAt: Date;
}
