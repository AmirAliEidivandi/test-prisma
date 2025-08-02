import { ApiProperty } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty({
    description: 'Profile ID',
    example: '1a624450-3a14-4910-a7f2-5ce67f0f772b',
  })
  id?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'amirali',
  })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'eidivandi',
  })
  lastName?: string;

  @ApiProperty({
    description: 'User email',
    example: 'amirfdali@gmail.com',
  })
  email?: string;

  @ApiProperty({
    description: 'User national code',
    example: '123732132432',
  })
  nationalCode?: string;

  @ApiProperty({
    description: 'User birth date',
    example: '2002-11-13T00:00:00.000Z',
  })
  birthDate?: string;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2025-08-02T12:37:59.292Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2025-08-02T12:37:59.359Z',
  })
  updatedAt?: Date;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '7cbaa954-1a5c-49ad-8478-9b554ccfaead',
  })
  id?: string;

  @ApiProperty({
    description: 'Profile ID reference',
    example: '1a624450-3a14-4910-a7f2-5ce67f0f772b',
  })
  profileId?: string;

  @ApiProperty({
    description: 'User job position',
    example: 'software engineer',
  })
  jobPosition?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '09132127492',
  })
  phone?: string;

  @ApiProperty({
    description: 'User address',
    example: 'new address',
  })
  address?: string;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2025-08-02T12:37:59.292Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2025-08-02T12:37:59.359Z',
  })
  updatedAt?: Date;

  @ApiProperty({
    description: 'User deletion timestamp (null if not deleted)',
    example: null,
    nullable: true,
  })
  deletedAt?: Date | null;

  @ApiProperty({
    description: 'User profile information',
    type: ProfileDto,
  })
  profile?: ProfileDto;
}
