import { Module } from '@nestjs/common';
import { KafkaModule } from '@services/kafka/kafka.module';
import { UserUtil } from '@utils/user.util';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RedisModule } from '@services/redis/redis.module';

@Module({
  imports: [KafkaModule],
  providers: [UsersService, UserUtil],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
