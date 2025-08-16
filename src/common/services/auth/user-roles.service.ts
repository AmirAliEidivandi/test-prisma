import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfileKafkaService } from '@services/kafka/profile/profile-kafka.service';
import { RedisService } from '@services/redis/redis.service';

@Injectable()
export class UserRolesService {
  constructor(
    private readonly profileKafkaService: ProfileKafkaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async ensureUserRoles(user: User): Promise<User> {
    if (Array.isArray(user?.roles) && user.roles.length > 0) {
      return user;
    }

    try {
      const cachedRoles = await this.redisService.getUserRoles(user.profile_id);
      if (Array.isArray(cachedRoles) && cachedRoles.length > 0) {
        user.roles = cachedRoles;
        return user;
      }
    } catch {}

    try {
      const roles = await this.profileKafkaService.getUserRolesByAllClients(
        user.preferred_username,
      );

      try {
        await this.redisService.setUserRoles(
          user.profile_id,
          roles,
          this.configService.get('EXPIRE_TIME'),
        );
      } catch {}

      user.roles = roles;
      return user;
    } catch {
      return user;
    }
  }
}
