import { KafkaServiceConstants } from '@constants/kafka.constants';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decrypt, encrypt } from '@utils/encryption.util';
import { Admin, Consumer, Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private admin: Admin;
  private readonly logger = new Logger(KafkaService.name);

  constructor(private readonly configService: ConfigService) {
    const brokers = [
      `${this.configService.get<string>('KAFKA_HOST')}:${this.configService.get<string>('KAFKA_PORT')}`,
    ];
    const clientId = KafkaServiceConstants.TEST_PRISMA_CLIENT_ID;
    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: { initialRetryTime: 1000, retries: 8 },
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: `${clientId}-group` });
    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();
    await this.admin.connect();
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    await this.producer.disconnect();
    await this.admin.disconnect();
  }

  async ensureTopic(topic: string) {
    const topics = await this.admin.listTopics();
    if (!topics.includes(topic)) {
      await this.admin.createTopics({
        topics: [
          {
            topic,
            numPartitions: 1,
            replicationFactor: 1,
          },
        ],
      });
      this.logger.log(`Topic ${topic} created`);
    }
  }

  async send<T>(topic: string, data: T) {
    await this.ensureTopic(topic);
    const value = encrypt(data);
    await this.producer.send({ topic, messages: [{ value }] });
  }

  async consume(topic: string, handler: (data: any) => Promise<void>) {
    await this.ensureTopic(topic);
    await this.consumer.subscribe({ topic, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        const payload = decrypt(message.value.toString());
        await handler(payload);
      },
    });
  }
}
