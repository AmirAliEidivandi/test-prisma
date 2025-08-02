import { KafkaMessagingEvents } from '@enums/kafka-events-messaging.enum';

export namespace KafkaServiceConstants {
  export const TEST_PRISMA_SERVICE_NAME = 'TEST_PRISMA_SERVICE';
  export const TEST_PRISMA_CLIENT_ID = 'test-prisma';
  export const TEST_PRISMA_GROUP_ID = 'test-prisma-consumer';

  export const PROFILE_SERVICE_NAME = 'PROFILE_SERVICE';
  export const PROFILE_CLIENT_ID = 'profile';
  export const PROFILE_GROUP_ID = 'profile-consumer';

  export const CLIENT_OPTIONS = {
    enforceRequestTimeout: false,
    retry: {
      initialRetryTime: 1000,
      retries: 20,
    },
  };

  // Kafka Topics
  export const TOPICS = {
    CREATE_PROFILE: KafkaMessagingEvents.CREATE_PROFILE,
    UPDATE_PROFILE: KafkaMessagingEvents.UPDATE_PROFILE,
    DELETE_PROFILE: KafkaMessagingEvents.DELETE_PROFILE,
    GET_PROFILE: KafkaMessagingEvents.GET_PROFILE,
    GET_ALL_PROFILES: KafkaMessagingEvents.GET_ALL_PROFILES,
    GET_PROFILE_BY_ID: KafkaMessagingEvents.GET_PROFILE_BY_ID,
    GET_PROFILE_BY_EMAIL: KafkaMessagingEvents.GET_PROFILE_BY_EMAIL,
    GET_PROFILE_BY_NATIONAL_CODE:
      KafkaMessagingEvents.GET_PROFILE_BY_NATIONAL_CODE,
  } as const;
}
