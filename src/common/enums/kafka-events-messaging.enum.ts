export enum KafkaMessagingEvents {
  CREATE_USER = 'create-user',
  CREATE_USER_RESPONSE = 'create-user-response',

  // Profile microservice events
  CREATE_PROFILE = 'create-profile',
  CREATE_PROFILE_RESPONSE = 'create-profile-response',
  GET_PROFILE = 'get-profile',
  GET_PROFILE_RESPONSE = 'get-profile-response',
  GET_PROFILES = 'get-profiles',
  GET_PROFILES_RESPONSE = 'get-profiles-response',
  UPDATE_PROFILE = 'update-profile',
  UPDATE_PROFILE_RESPONSE = 'update-profile-response',
  DELETE_PROFILE = 'delete-profile',
  DELETE_PROFILE_RESPONSE = 'delete-profile-response',

  // Topic management
  ENSURE_TOPICS_EXIST = 'ensure-topics-exist',
  TOPICS_ENSURED = 'topics-ensured',
}
