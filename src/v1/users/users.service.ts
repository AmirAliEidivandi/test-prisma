import { KafkaServiceConstants } from '@constants/kafka.constants';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { UserResponse } from '@responses/index';
import { KafkaService } from '@services/kafka/kafka.service';
import { PrismaService } from '@services/prisma/prisma.service';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { randomUUID } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

interface PendingRequest {
  resolve: (value: UserProfileResponseDto) => void;
  reject: (reason: any) => void;
  timeout: NodeJS.Timeout;
}

@Injectable()
export class UsersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsersService.name);
  private userResponse: UserResponse;
  private pendingRequests = new Map<string, PendingRequest>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
    private readonly i18n: I18nService,
  ) {
    this.userResponse = new UserResponse(this.i18n);
  }

  async onModuleInit() {
    try {
      // Subscribe to user creation response topic
      await this.kafka.consume(
        KafkaServiceConstants.TOPICS.CREATE_USER_RESPONSE,
        this.handleUserCreationResponse.bind(this),
      );
      this.logger.log(
        `Subscribed to topic: ${KafkaServiceConstants.TOPICS.CREATE_USER_RESPONSE}`,
      );
    } catch (error) {
      this.logger.error('Failed to subscribe to Kafka topic', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    // Clean up any pending requests
    for (const [requestId, pendingRequest] of this.pendingRequests) {
      clearTimeout(pendingRequest.timeout);
      pendingRequest.reject(new Error('Service is shutting down'));
    }
    this.pendingRequests.clear();
    this.logger.log('Cleaned up pending requests on module destroy');
  }

  private async validateProfileResponse(
    data: any,
  ): Promise<UserProfileResponseDto> {
    try {
      const profileResponse = plainToClass(UserProfileResponseDto, data);
      const errors = await validate(profileResponse);

      if (errors.length > 0) {
        this.logger.error('Invalid profile response received', errors);
        throw new BadRequestException('Invalid profile response format');
      }

      return profileResponse;
    } catch (error) {
      this.logger.error('Failed to validate profile response', error);
      throw error;
    }
  }

  private async handleUserCreationResponse(data: any) {
    try {
      // Validate the response structure
      const validatedResponse = await this.validateProfileResponse(data);
      const { requestId } = validatedResponse;

      this.logger.log(`Received profile response for requestId: ${requestId}`);

      const pendingRequest = this.pendingRequests.get(requestId);

      if (pendingRequest) {
        clearTimeout(pendingRequest.timeout);
        this.pendingRequests.delete(requestId);
        pendingRequest.resolve(validatedResponse);
        this.logger.log(`Successfully resolved request: ${requestId}`);
      } else {
        this.logger.warn(
          `No pending request found for requestId: ${requestId}`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling user creation response', error);
      // If we have validation errors, we should reject any pending request
      if (data?.requestId) {
        const pendingRequest = this.pendingRequests.get(data.requestId);
        if (pendingRequest) {
          clearTimeout(pendingRequest.timeout);
          this.pendingRequests.delete(data.requestId);
          pendingRequest.reject(error);
        }
      }
    }
  }

  private async sendUserCreationRequest(
    userData: CreateUserDto,
  ): Promise<UserProfileResponseDto> {
    const requestId = randomUUID();
    this.logger.log(`Sending user creation request with ID: ${requestId}`);

    return new Promise((resolve, reject) => {
      // Set timeout for request (30 seconds)
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        this.logger.error(`Kafka request timeout for requestId: ${requestId}`);
        reject(
          new InternalServerErrorException(
            this.i18n.t('exception.errors.common.KAFKA_REQUEST_TIMEOUT'),
          ),
        );
      }, 30000);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
      });

      // Send request to profile microservice
      const payload = {
        requestId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        birthDate: userData.birthDate,
        nationalCode: userData.nationalCode,
      };

      this.kafka
        .send(KafkaServiceConstants.TOPICS.CREATE_USER, payload)
        .then(() => {
          this.logger.log(
            `Successfully sent user creation request: ${requestId}`,
          );
        })
        .catch((error) => {
          clearTimeout(timeout);
          this.pendingRequests.delete(requestId);
          this.logger.error(
            `Failed to send Kafka message for requestId: ${requestId}`,
            error,
          );
          reject(error);
        });
    });
  }

  async create(createUserDto: CreateUserDto) {
    try {
      this.logger.log('Creating new user...');

      // Send request to profile microservice and wait for response
      const profileResponse = await this.sendUserCreationRequest(createUserDto);
      this.logger.log(
        `Received profile response with ID: ${profileResponse._id}`,
      );

      // Use transaction to ensure data consistency
      const user = await this.prisma.$transaction(async (prisma) => {
        // Check if user already exists with this profileId
        const existingUser = await prisma.user.findUnique({
          where: { profileId: profileResponse._id },
        });

        if (existingUser) {
          throw new BadRequestException(
            'User with this profile already exists',
          );
        }

        // Create user with additional info and profileId
        return await prisma.user.create({
          data: {
            profileId: profileResponse._id,
            jobPosition: createUserDto.jobPosition,
            phone: createUserDto.phone,
            address: createUserDto.address,
          },
        });
      });

      this.logger.log(
        `Successfully created user with profileId: ${profileResponse._id}`,
      );
      return this.userResponse.created(user);
    } catch (error) {
      this.logger.error('Failed to create user', error);
      throw error;
    }
  }

  async findAll(queryUserDto: QueryUserDto) {
    try {
      const { search, sort, page, limit } = queryUserDto;
      this.logger.log(`Finding users with page: ${page}, limit: ${limit}`);

      const [users, totalCount] = await Promise.all([
        this.prisma.user.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          skip: page * limit,
          take: limit,
        }),
        this.prisma.user.count(),
      ]);

      this.logger.log(`Found ${users.length} users out of ${totalCount} total`);
      return this.userResponse.listed(users, totalCount, page, limit);
    } catch (error) {
      this.logger.error('Failed to fetch users', error);
      throw error;
    }
  }

  // Health check method
  getKafkaHealthStatus() {
    return {
      pendingRequests: this.pendingRequests.size,
      isHealthy: this.pendingRequests.size < 100, // Consider unhealthy if too many pending requests
    };
  }
}
