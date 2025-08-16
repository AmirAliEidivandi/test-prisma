import { KafkaServiceConstants } from '@constants/kafka.constants';
import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { decrypt, encrypt } from '@utils/encryption.util';
import { ProfileResponse } from './profile-response.entity';
import { Profile } from './profile.entity';

@Injectable()
export class ProfileKafkaService {
  constructor(
    @Inject(KafkaServiceConstants.PROFILE_SERVICE_NAME)
    private readonly kafkaClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.kafkaClient.subscribeToResponseOf(
      KafkaServiceConstants.TOPICS.GET_USER_ROLES,
    );
    this.kafkaClient.subscribeToResponseOf(
      KafkaServiceConstants.TOPICS.GET_USER,
    );
    this.kafkaClient.subscribeToResponseOf(
      KafkaServiceConstants.TOPICS.GET_USER_ROLES_BY_ALL_CLIENTS,
    );
  }

  private normalizeProfile(raw: any): Profile {
    const {
      mobile: mobileNumber,
      mobile_prefix: prefix,
      mobile_country_code: countryCode,
      ...rest
    } = raw ?? {};

    const normalized: Profile = {
      ...rest,
      mobile: {
        prefix,
        mobile_number: mobileNumber,
        country_code: countryCode,
      },
    };

    return normalized;
  }

  // createProfile(dto: CreateUserDto) {
  //   return new Promise<ProfileResponseDto>((resolve, reject) => {
  //     this.kafkaClient
  //       .send(KafkaServiceConstants.TOPICS.CREATE_PROFILE, encrypt(dto))
  //       .subscribe({
  //         next: (value) => {
  //           const response = decrypt(value) as ProfileResponseDto;
  //           resolve(response);
  //         },
  //         error: (error) => reject(error),
  //       });
  //   });
  // }

  // findAllProfile(
  //   profileIds: string[],
  //   page: number,
  //   limit: number,
  //   select: string[],
  // ) {
  //   return new Promise<{
  //     users: ProfileResponseDto[];
  //     totalCount: number;
  //   }>((resolve, reject) => {
  //     this.kafkaClient
  //       .send(
  //         KafkaServiceConstants.TOPICS.GET_ALL_PROFILES,
  //         encrypt({ profileIds, page, limit, select: select.join(' ') }),
  //       )
  //       .subscribe({
  //         next: (value) => {
  //           const response = decrypt(value) as {
  //             users: ProfileResponseDto[];
  //             totalCount: number;
  //           };
  //           resolve(response);
  //         },
  //         error: (error) => reject(error),
  //       });
  //   });
  // }

  findOneProfile(id: string, select: string[]) {
    return new Promise<Profile>((resolve, reject) => {
      this.kafkaClient
        .send(
          KafkaServiceConstants.TOPICS.GET_USER,
          encrypt({ id, select: select.join(' ') }),
        )
        .subscribe({
          next: (value) => {
            const response = decrypt(value) as ProfileResponse;
            const rawProfile = response.data[0];
            const normalized = this.normalizeProfile(rawProfile);
            resolve(normalized);
          },
          error: (error) => reject(error),
        });
    });
  }

  // async updateProfile(id: string, updateProfileDto: UpdateUserDto) {
  //   return new Promise<ProfileResponseDto>((resolve, reject) => {
  //     this.kafkaClient
  //       .send(
  //         KafkaServiceConstants.TOPICS.UPDATE_PROFILE,
  //         encrypt({ id, updateProfileDto }),
  //       )
  //       .subscribe({
  //         next: (value) => {
  //           const response = decrypt(value) as ProfileResponseDto;
  //           resolve(response);
  //         },
  //         error: (error) => reject(error),
  //       });
  //   });
  // }

  // deleteProfile(id: string) {
  //   this.kafkaClient.emit(
  //     KafkaServiceConstants.TOPICS.DELETE_PROFILE,
  //     encrypt({ id }),
  //   );
  // }

  async getUserRoles(username: string, clientId: string) {
    return new Promise<string[]>((resolve, reject) => {
      this.kafkaClient
        .send(
          KafkaServiceConstants.TOPICS.GET_USER_ROLES,
          encrypt({ username, client_id: clientId }),
        )
        .subscribe({
          next: (value) => {
            const data: any = decrypt(value);
            const roles = Array.isArray(data)
              ? data
              : Array.isArray(data?.roles)
                ? data.roles
                : [];
            resolve(roles);
          },
          error: (error) => reject(error),
        });
    });
  }

  async getUserRolesByAllClients(username: string) {
    return new Promise<string[]>((resolve, reject) => {
      this.kafkaClient
        .send(
          KafkaServiceConstants.TOPICS.GET_USER_ROLES_BY_ALL_CLIENTS,
          encrypt({ username }),
        )
        .subscribe({
          next: (value) => {
            const data: any = decrypt(value);
            const roles = Array.isArray(data)
              ? data
              : Array.isArray(data?.roles)
                ? data.roles
                : [];
            resolve(roles);
          },
          error: (error) => reject(error),
        });
    });
  }
}
