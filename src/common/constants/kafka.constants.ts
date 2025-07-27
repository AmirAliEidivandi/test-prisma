import { KafkaMessagingEvents } from '@enums/kafka-events-messaging.enum';

export namespace KafkaServiceConstants {
  export const TEST_PRISMA_SERVICE_NAME = 'TEST_PRISMA_SERVICE';
  export const TEST_PRISMA_CLIENT_ID = 'test-prisma';
  export const TEST_PRISMA_GROUP_ID = 'test-prisma-consumer';

  export const CLIENT_OPTIONS = {
    enforceRequestTimeout: false,
    retry: {
      initialRetryTime: 1000,
      retries: 20,
    },
  };

  // Kafka Topics
  export const TOPICS = {
    CREATE_USER: KafkaMessagingEvents.CREATE_USER,
    CREATE_USER_RESPONSE: KafkaMessagingEvents.CREATE_USER_RESPONSE,
  } as const;
}
