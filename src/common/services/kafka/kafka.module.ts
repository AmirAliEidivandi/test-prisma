import { KafkaServiceConstants } from '@constants/kafka.constants';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LogKafkaService } from './log/log-kafka.service';
import { WalletKafkaService } from './pay/wallet-kafka.service';
import { ProfileKafkaService } from './profile/profile-kafka.service';

const clients = [
  {
    name: KafkaServiceConstants.PROFILE_SERVICE_NAME,
    clientId: KafkaServiceConstants.PROFILE_CLIENT_ID,
    groupId: KafkaServiceConstants.PROFILE_GROUP_ID,
  },
  {
    name: KafkaServiceConstants.TEST_PRISMA_SERVICE_NAME,
    clientId: KafkaServiceConstants.TEST_PRISMA_CLIENT_ID,
    groupId: KafkaServiceConstants.TEST_PRISMA_GROUP_ID,
  },
  {
    name: KafkaServiceConstants.PAY_SERVICE_NAME,
    clientId: KafkaServiceConstants.PAY_CLIENT_ID,
    groupId: KafkaServiceConstants.PAY_GROUP_ID,
  },
  {
    name: KafkaServiceConstants.LOG_SERVICE_NAME,
    clientId: KafkaServiceConstants.LOG_CLIENT_ID,
    groupId: KafkaServiceConstants.LOG_GROUP_ID,
  },
];

const items = [
  ClientsModule.registerAsync({
    clients: clients.map((client) => ({
      name: client.name,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: client.clientId,
              brokers: [
                `${configService.get<string>(
                  'KAFKA_HOST',
                )}:${configService.get<number>('KAFKA_PORT')}`,
              ],
              ...KafkaServiceConstants.CLIENT_OPTIONS,
            },
            consumer: {
              groupId: client.groupId,
              allowAutoTopicCreation: true,
            },
          },
        };
      },
      inject: [ConfigService],
    })),
  }),
];

@Global()
@Module({
  imports: [ConfigModule, ...items],
  providers: [ProfileKafkaService, WalletKafkaService, LogKafkaService],
  exports: [ProfileKafkaService, WalletKafkaService, LogKafkaService, ...items],
})
export class KafkaModule {}
