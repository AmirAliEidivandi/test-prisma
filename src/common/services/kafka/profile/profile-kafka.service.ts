import { KafkaServiceConstants } from '@constants/kafka.constants';
import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { decrypt, encrypt } from '@utils/encryption.util';
import { ProfileResponseDto } from './profile-response.dto';

@Injectable()
export class ProfileKafkaService {
  constructor(
    @Inject(KafkaServiceConstants.PROFILE_SERVICE_NAME)
    private readonly kafkaClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.kafkaClient.subscribeToResponseOf(
      KafkaServiceConstants.TOPICS.CREATE_PROFILE,
    );
    this.kafkaClient.subscribeToResponseOf(
      KafkaServiceConstants.TOPICS.GET_ALL_PROFILES,
    );
    this.kafkaClient.subscribeToResponseOf(
      KafkaServiceConstants.TOPICS.GET_PROFILE,
    );
    this.kafkaClient.subscribeToResponseOf(
      KafkaServiceConstants.TOPICS.UPDATE_PROFILE,
    );
  }

  createProfile(dto: CreateUserDto) {
    return new Promise<ProfileResponseDto>((resolve, reject) => {
      this.kafkaClient
        .send(KafkaServiceConstants.TOPICS.CREATE_PROFILE, encrypt(dto))
        .subscribe({
          next: (value) => {
            const response = decrypt(value) as ProfileResponseDto;
            resolve(response);
          },
          error: (error) => reject(error),
        });
    });
  }

  findAllProfile(
    profileIds: string[],
    page: number,
    limit: number,
    select: string[],
  ) {
    return new Promise<{
      users: ProfileResponseDto[];
      totalCount: number;
    }>((resolve, reject) => {
      this.kafkaClient
        .send(
          KafkaServiceConstants.TOPICS.GET_ALL_PROFILES,
          encrypt({ profileIds, page, limit, select: select.join(' ') }),
        )
        .subscribe({
          next: (value) => {
            const response = decrypt(value) as {
              users: ProfileResponseDto[];
              totalCount: number;
            };
            resolve(response);
          },
          error: (error) => reject(error),
        });
    });
  }

  findOneProfile(id: string, select: string[]) {
    return new Promise<ProfileResponseDto>((resolve, reject) => {
      this.kafkaClient
        .send(
          KafkaServiceConstants.TOPICS.GET_PROFILE,
          encrypt({ id, select: select.join(' ') }),
        )
        .subscribe({
          next: (value) => {
            const response = decrypt(value) as ProfileResponseDto;
            resolve(response);
          },
          error: (error) => reject(error),
        });
    });
  }

  async updateProfile(id: string, updateProfileDto: UpdateUserDto) {
    return new Promise<ProfileResponseDto>((resolve, reject) => {
      this.kafkaClient
        .send(
          KafkaServiceConstants.TOPICS.UPDATE_PROFILE,
          encrypt({ id, updateProfileDto }),
        )
        .subscribe({
          next: (value) => {
            const response = decrypt(value) as ProfileResponseDto;
            resolve(response);
          },
          error: (error) => reject(error),
        });
    });
  }
}
