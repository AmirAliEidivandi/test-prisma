import { KafkaServiceConstants } from '@constants/kafka.constants';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

const clients = [];
const items = [
  ClientsModule.registerAsync({
    clients: clients.map((client) => ({
      name: client.name,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
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
          },
        },
      }),
      inject: [ConfigService],
    })),
  }),
];

@Module({
  imports: [...items],
  providers: [],
  exports: [...items],
})
export class KafkaModule {}
