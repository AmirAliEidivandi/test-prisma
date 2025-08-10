import { KafkaMessagingEvents } from '@enums/kafka-events-messaging.enum';

export namespace KafkaServiceConstants {
  export const TEST_PRISMA_SERVICE_NAME = 'TEST_PRISMA_SERVICE';
  export const TEST_PRISMA_CLIENT_ID = 'test-prisma';
  export const TEST_PRISMA_GROUP_ID = 'test-prisma-consumer';

  export const PROFILE_SERVICE_NAME = 'PROFILE_SERVICE';
  export const PROFILE_CLIENT_ID = 'profile';
  export const PROFILE_GROUP_ID = 'profile_consumer_profile';

  export const CLIENT_OPTIONS = {
    enforceRequestTimeout: false,
    retry: {
      initialRetryTime: 1000,
      retries: 20,
    },
  };

  // Kafka Topics
  export const TOPICS = {
    GET_USER: KafkaMessagingEvents.GET_USER,
    GET_USER_ROLES: KafkaMessagingEvents.GET_USER_ROLES,
    REGISTERED_USER: KafkaMessagingEvents.REGISTERED_USER,
  } as const;
}
