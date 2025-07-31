import { ApiProperty } from '@nestjs/swagger';
import { ProfileDto } from 'src/v1/profiles/interfaces/profile.interface';

export class ResponseUserWithProfileDto {
  @ApiProperty({
    description: 'The ID of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The profile ID of the user',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  profileId: string;

  @ApiProperty({
    description: 'The job position of the user',
    example: 'Software Engineer',
  })
  jobPosition: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '09123456789',
  })
  phone: string;

  @ApiProperty({
    description: 'The address of the user',
    example: '123 Main St, Anytown, USA',
  })
  address: string;

  @ApiProperty({
    description: 'The creation date of the user',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The last update date of the user',
    example: '2023-01-02T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'The deletion date of the user',
    example: null,
  })
  deletedAt: Date | null;

  @ApiProperty({
    description: 'The profile data of the user',
  })
  profile?: ProfileDto;
}
