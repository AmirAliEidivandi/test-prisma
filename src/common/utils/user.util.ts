import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfileKafkaService } from '@services/kafka/profile/profile-kafka.service';
import { RedisService } from '@services/redis/redis.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UserUtil {
  constructor(
    private readonly profileKafkaService: ProfileKafkaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly i18nService: I18nService,
  ) {}

  async computeRoles(user: User) {
    const cachedRoles = await this.redisService.getUserRoles(user.profile_id);
    if (cachedRoles) {
      user.roles = cachedRoles;
      return user;
    }

    try {
      const roles = await this.profileKafkaService.getUserRoles(
        user.preferred_username,
        this.configService.get('KEYCLOAK_PRISMA_CLIENT'),
      );
      await this.redisService.setUserRoles(
        user.profile_id,
        roles,
        this.configService.get('EXPIRE_TIME'),
      );
      user.roles = roles;
      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        this.i18nService.t('exceptions.errors.auth.FAILED_TO_COMPUTE_ROLES'),
      );
    }
  }
}
