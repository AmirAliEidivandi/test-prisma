import { KafkaServiceConstants } from '@constants/kafka.constants';
import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CreateUserDto } from '@users/dto/create-user.dto';
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
}
