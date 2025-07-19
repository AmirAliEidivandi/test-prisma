export namespace KafkaServiceConstants {
  // export const COMPANY_SERVICE_NAME = 'COMPANY_SERVICE';
  // export const COMPANY_CLIENT_ID = 'company';
  // export const COMPANY_GROUP_ID = 'company_consumer';

  // export const PROFILE_SERVICE_NAME = 'PROFILE_SERVICE';
  // export const PROFILE_CLIENT_ID = 'profile';
  // export const PROFILE_GROUP_ID = 'profile_consumer';

  export const CLIENT_OPTIONS = {
    enforceRequestTimeout: false,
    retry: {
      initialRetryTime: 1000,
      retries: 20,
    },
  };
}
