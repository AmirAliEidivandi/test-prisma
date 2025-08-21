import { IRole } from '@interfaces/role.interface';
import { ApiProperty } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty({
    description: 'user keycloak id',
    type: String,
    example: '7cbaa954-1a5c-49ad-8478-9b554ccfaead',
  })
  kid?: string;

  @ApiProperty({
    description: 'user id',
    type: String,
    example: '1a624450-3a14-4910-a7f2-5ce67f0f772b',
  })
  _id?: string;

  @ApiProperty({
    description: 'user first name',
    type: String,
    example: 'John',
  })
  first_name?: string;

  @ApiProperty({
    description: 'user last name',
    type: String,
    example: 'Doe',
  })
  last_name?: string;

  @ApiProperty({
    description: 'user email',
    type: String,
    example: 'john.doe@example.com',
  })
  email?: string;

  @ApiProperty({
    description: 'user national code',
    type: String,
    example: '1234567890',
  })
  national_code?: string;

  @ApiProperty({
    description: 'user birth date',
    type: String,
    example: '1990-01-01',
  })
  birth_date?: string;

  @ApiProperty({
    description: 'user mobile',
    type: Object,
    example: {
      prefix: '+98',
      mobile_number: '9123456789',
      country_code: 'IR',
    },
  })
  mobile?: {
    prefix?: string;
    mobile_number?: string;
    country_code?: string;
  };

  @ApiProperty({
    description: 'user mobile verified',
    type: Boolean,
    example: true,
  })
  mobile_verified?: boolean;

  @ApiProperty({
    description: 'user enabled',
    type: Boolean,
    example: true,
  })
  enabled?: boolean;

  @ApiProperty({
    description: 'user gender',
    type: String,
    example: 'male',
  })
  gender?: string;

  @ApiProperty({
    description: 'user groups',
    type: Array,
    example: [
      '1a624450-3a14-4910-a7f2-5ce67f0f772b',
      '1a624450-3a14-4910-a7f2-5ce67f0f772b',
    ],
    format: 'uuid',
  })
  groups?: string[];

  @ApiProperty({
    description: 'user clients',
    type: Array,
    example: [
      '1a624450-3a14-4910-a7f2-5ce67f0f772b',
      '1a624450-3a14-4910-a7f2-5ce67f0f772b',
    ],
    format: 'uuid',
  })
  clients?: string[];

  @ApiProperty({
    description: 'user roles',
    type: Array,
    example: [
      {
        id: '1a624450-3a14-4910-a7f2-5ce67f0f772b',
        title: 'admin',
        client_id: '1a624450-3a14-4910-a7f2-5ce67f0f772b',
      },
    ],
  })
  roles?: IRole[];

  @ApiProperty({
    description: 'user username',
    type: String,
    example: 'john.doe',
  })
  username?: string;

  @ApiProperty({
    description: 'user language',
    type: String,
    example: 'en',
  })
  language?: string;

  @ApiProperty({
    description: 'user branch',
    type: String,
    example: 'branch1',
  })
  branch?: string;

  @ApiProperty({
    description: 'user third party provider',
    type: String,
    example: 'google',
  })
  third_party_provider?: string;

  @ApiProperty({
    description: 'user is verified via third party',
    type: Boolean,
    example: true,
  })
  is_verified_via_third_party?: boolean;

  @ApiProperty({
    description: 'user creation timestamp',
    type: Date,
    example: '2025-08-02T12:37:59.292Z',
  })
  created_at?: Date;

  @ApiProperty({
    description: 'user last update timestamp',
    type: Date,
    example: '2025-08-02T12:37:59.359Z',
  })
  updated_at?: Date;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    type: String,
    example: '7cbaa954-1a5c-49ad-8478-9b554ccfaead',
  })
  id?: string;

  @ApiProperty({
    description: 'Profile ID reference',
    type: String,
    example: '1a624450-3a14-4910-a7f2-5ce67f0f772b',
  })
  profile_id?: string;

  @ApiProperty({
    description: 'User creation timestamp',
    type: Date,
    example: '2025-08-02T12:37:59.292Z',
  })
  created_at?: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    type: Date,
    example: '2025-08-02T12:37:59.359Z',
  })
  updated_at?: Date;

  @ApiProperty({
    description: 'User deletion timestamp (null if not deleted)',
    type: Date,
    example: null,
    nullable: true,
  })
  deleted_at?: Date | null;

  @ApiProperty({
    description: 'User profile information',
    type: ProfileDto,
  })
  profile?: ProfileDto;
}
