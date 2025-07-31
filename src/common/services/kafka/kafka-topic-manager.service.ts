import { KafkaServiceConstants } from '@constants/kafka.constants';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from './kafka.service';

@Injectable()
export class KafkaTopicManager implements OnModuleInit {
  private readonly logger = new Logger(KafkaTopicManager.name);
  private topicsEnsured = false;

  constructor(private readonly kafkaService: KafkaService) {}

  async onModuleInit() {
    // Ensure all topics exist on service startup
    await this.ensureAllTopicsExist();

    // Listen for topic ensure requests
    this.kafkaService.consume(
      KafkaServiceConstants.TOPICS.ENSURE_TOPICS_EXIST,
      async () => {
        await this.ensureAllTopicsExist();
        await this.kafkaService.send(
          KafkaServiceConstants.TOPICS.TOPICS_ENSURED,
          {
            success: true,
            timestamp: new Date().toISOString(),
          },
        );
      },
    );
  }

  async ensureAllTopicsExist(): Promise<void> {
    if (this.topicsEnsured) {
      this.logger.log('Topics already ensured');
      return;
    }

    this.logger.log('Ensuring all Kafka topics exist...');

    // Get all topic values from the TOPICS constant
    const topics = Object.values(KafkaServiceConstants.TOPICS);

    // Create each topic if it doesn't exist
    for (const topic of topics) {
      await this.kafkaService.ensureTopic(topic);
      this.logger.log(`Topic ${topic} ensured`);
    }

    this.topicsEnsured = true;
    this.logger.log('All Kafka topics have been ensured');
  }

  async requestTopicEnsurance(): Promise<void> {
    try {
      await this.kafkaService.send(
        KafkaServiceConstants.TOPICS.ENSURE_TOPICS_EXIST,
        {
          requestedAt: new Date().toISOString(),
        },
      );
      this.logger.log('Topic ensurance requested');
    } catch (error) {
      this.logger.error('Failed to request topic ensurance', error);
      // Fallback to local ensurance
      await this.ensureAllTopicsExist();
    }
  }
}
