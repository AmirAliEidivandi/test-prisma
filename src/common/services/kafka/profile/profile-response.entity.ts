import { KafkaResponse } from '@dto/kafka-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Profile } from './profile.entity';

export class ProfileResponse extends KafkaResponse<Profile> {
  @ApiProperty({
    type: Profile,
    description: 'Users array',
  })
  @Type(() => Profile)
  data: Profile[];
}
