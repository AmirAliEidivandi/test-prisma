import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ProfileKafkaService } from '@services/kafka/profile/profile-kafka.service';
import { RedisService } from '@services/redis/redis.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly profileKafkaService: ProfileKafkaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly i18nService: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    const user: User = context.switchToHttp().getRequest().user;
    const cachedRoles = await this.redisService.getUserRoles(user.profile_id);

    if (cachedRoles) {
      return requiredRoles.some((role) => cachedRoles.includes(role));
    } else {
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
        return requiredRoles.some((role) => roles.includes(role));
      } catch (error) {
        throw new InternalServerErrorException(
          this.i18nService.t('exceptions.errors.auth.FAILED_TO_COMPUTE_ROLES'),
        );
      }
    }
  }
}
