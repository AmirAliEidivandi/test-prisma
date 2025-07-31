import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaTopicManager } from './kafka-topic-manager.service';
import { KafkaService } from './kafka.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [KafkaService, KafkaTopicManager],
  exports: [KafkaService, KafkaTopicManager],
})
export class KafkaModule {}
