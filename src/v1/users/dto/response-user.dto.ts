import { IRole } from '@interfaces/role.interface';
import { ApiProperty } from '@nestjs/swagger';

export class ProfileDto {
  kid?: string;
  _id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  national_code?: string;
  birth_date?: string;
  mobile?: {
    prefix?: string;
    mobile_number?: string;
    country_code?: string;
  };
  mobile_verified?: boolean;
  enabled?: boolean;
  gender?: string;
  groups?: string[];
  clients?: string[];
  roles?: IRole[];
  username?: string;
  language?: string;
  branch?: string;
  timestamps?: number[];
  third_party_provider?: string;
  is_verified_via_third_party?: boolean;
  created_at?: Date;
  updated_at?: Date;
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
  profile_id?: string;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2025-08-02T12:37:59.292Z',
  })
  created_at?: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2025-08-02T12:37:59.359Z',
  })
  updated_at?: Date;

  @ApiProperty({
    description: 'User deletion timestamp (null if not deleted)',
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
