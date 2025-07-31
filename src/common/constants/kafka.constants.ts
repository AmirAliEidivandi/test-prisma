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

    // Profile microservice topics
    CREATE_PROFILE: KafkaMessagingEvents.CREATE_PROFILE,
    CREATE_PROFILE_RESPONSE: KafkaMessagingEvents.CREATE_PROFILE_RESPONSE,
    GET_PROFILE: KafkaMessagingEvents.GET_PROFILE,
    GET_PROFILE_RESPONSE: KafkaMessagingEvents.GET_PROFILE_RESPONSE,
    GET_PROFILES: KafkaMessagingEvents.GET_PROFILES,
    GET_PROFILES_RESPONSE: KafkaMessagingEvents.GET_PROFILES_RESPONSE,
    UPDATE_PROFILE: KafkaMessagingEvents.UPDATE_PROFILE,
    UPDATE_PROFILE_RESPONSE: KafkaMessagingEvents.UPDATE_PROFILE_RESPONSE,
    DELETE_PROFILE: KafkaMessagingEvents.DELETE_PROFILE,
    DELETE_PROFILE_RESPONSE: KafkaMessagingEvents.DELETE_PROFILE_RESPONSE,

    // Topic management
    ENSURE_TOPICS_EXIST: KafkaMessagingEvents.ENSURE_TOPICS_EXIST,
    TOPICS_ENSURED: KafkaMessagingEvents.TOPICS_ENSURED,
  } as const;
}
