import { Module } from '@nestjs/common';
import { KafkaModule } from '@services/kafka/kafka.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [KafkaModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
