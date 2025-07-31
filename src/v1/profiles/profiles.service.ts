import { KafkaServiceConstants } from '@constants/kafka.constants';
import { Injectable, Logger } from '@nestjs/common';
import { KafkaTopicManager } from '@services/kafka/kafka-topic-manager.service';
import { KafkaService } from '@services/kafka/kafka.service';
import { randomUUID } from 'crypto';
import {
  CreateProfileRequest,
  CreateProfileResponse,
  DeleteProfileRequest,
  DeleteProfileResponse,
  GetProfileRequest,
  GetProfileResponse,
  GetProfilesRequest,
  GetProfilesResponse,
  ProfileDto,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from './interfaces/profile.interface';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly kafkaTopicManager: KafkaTopicManager,
  ) {}

  /**
   * Send a request to the Profile microservice and wait for a response on the response topic
   */
  private async sendAndReceive<TRequest, TResponse>(
    requestTopic: string,
    responseTopic: string,
    payload: TRequest & { correlationId?: string },
  ): Promise<TResponse> {
    // Ensure topics exist before sending
    await this.kafkaTopicManager.ensureAllTopicsExist();

    // Add correlation ID to trace the request-response flow
    const correlationId = payload.correlationId || randomUUID();
    payload.correlationId = correlationId;

    // Create a promise that will be resolved when the response is received
    return new Promise<TResponse>(async (resolve, reject) => {
      // Set a timeout for the request
      const timeoutId = setTimeout(() => {
        reject(
          new Error(`Request to ${requestTopic} timed out after 30 seconds`),
        );
      }, 30000);

      // Set up one-time listener for the response with matching correlationId
      const responseHandler = (response: any) => {
        if (response.correlationId === correlationId) {
          clearTimeout(timeoutId);
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response as TResponse);
          }
          return true; // Signal to stop listening after processing this message
        }
        return false; // Keep listening for the right correlation ID
      };

      try {
        // Start listening for the response
        await this.kafkaService.consumeOnce(responseTopic, responseHandler);

        // Send the request
        await this.kafkaService.send(requestTopic, payload);
        this.logger.debug(
          `Request sent to ${requestTopic} with correlationId ${correlationId}`,
        );
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  async createProfile(data: CreateProfileRequest): Promise<ProfileDto> {
    this.logger.log(`Creating profile for data: ${JSON.stringify(data)}`);

    try {
      const response = await this.sendAndReceive<
        CreateProfileRequest,
        CreateProfileResponse
      >(
        KafkaServiceConstants.TOPICS.CREATE_PROFILE,
        KafkaServiceConstants.TOPICS.CREATE_PROFILE_RESPONSE,
        data,
      );

      if (!response.success || !response.profile) {
        throw new Error(response.error || 'Failed to create profile');
      }

      return response.profile;
    } catch (error) {
      this.logger.error(
        `Failed to create profile: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getProfile(id: string): Promise<ProfileDto> {
    this.logger.log(`Getting profile with ID: ${id}`);

    try {
      const response = await this.sendAndReceive<
        GetProfileRequest,
        GetProfileResponse
      >(
        KafkaServiceConstants.TOPICS.GET_PROFILE,
        KafkaServiceConstants.TOPICS.GET_PROFILE_RESPONSE,
        { id },
      );

      if (!response.success || !response.profile) {
        throw new Error(response.error || `Profile with ID ${id} not found`);
      }

      return response.profile;
    } catch (error) {
      this.logger.error(`Failed to get profile: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getProfiles(request: GetProfilesRequest): Promise<GetProfilesResponse> {
    this.logger.log(
      `Getting profiles with request: ${JSON.stringify(request)}`,
    );

    try {
      const response = await this.sendAndReceive<
        GetProfilesRequest,
        GetProfilesResponse
      >(
        KafkaServiceConstants.TOPICS.GET_PROFILES,
        KafkaServiceConstants.TOPICS.GET_PROFILES_RESPONSE,
        request,
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to get profiles');
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get profiles: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateProfile(request: UpdateProfileRequest): Promise<ProfileDto> {
    this.logger.log(`Updating profile with ID: ${request.id}`);

    try {
      const response = await this.sendAndReceive<
        UpdateProfileRequest,
        UpdateProfileResponse
      >(
        KafkaServiceConstants.TOPICS.UPDATE_PROFILE,
        KafkaServiceConstants.TOPICS.UPDATE_PROFILE_RESPONSE,
        request,
      );

      if (!response.success || !response.profile) {
        throw new Error(
          response.error || `Failed to update profile with ID ${request.id}`,
        );
      }

      return response.profile;
    } catch (error) {
      this.logger.error(
        `Failed to update profile: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteProfile(id: string): Promise<boolean> {
    this.logger.log(`Deleting profile with ID: ${id}`);

    try {
      const response = await this.sendAndReceive<
        DeleteProfileRequest,
        DeleteProfileResponse
      >(
        KafkaServiceConstants.TOPICS.DELETE_PROFILE,
        KafkaServiceConstants.TOPICS.DELETE_PROFILE_RESPONSE,
        { id },
      );

      if (!response.success) {
        throw new Error(
          response.error || `Failed to delete profile with ID ${id}`,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete profile: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
