import { Module } from '@nestjs/common';
import { KafkaModule } from '@services/kafka/kafka.module';
import { SharedService } from './shared.service';

@Module({
  imports: [KafkaModule],
  providers: [SharedService],
  exports: [SharedService, KafkaModule],
})
export class SharedModule {}
