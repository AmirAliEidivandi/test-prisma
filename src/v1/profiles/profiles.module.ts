import { Module } from '@nestjs/common';
import { KafkaModule } from '@services/kafka/kafka.module';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [KafkaModule],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
