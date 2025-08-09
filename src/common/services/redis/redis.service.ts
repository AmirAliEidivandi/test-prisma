import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async get(key: string) {
    return this.redisClient.get(`${key}-project`);
  }

  async set(key: string, value: any, ttl?: number) {
    if (ttl) {
      return this.redisClient.setex(`${key}-project`, ttl, value);
    }
    return this.redisClient.set(`${key}-project`, value);
  }

  async del(key: string) {
    return this.redisClient.del(`${key}-project`);
  }

  async getUserRoles(profileId: string) {
    const data = await this.get(profileId);
    return data ? JSON.parse(data) : [];
  }

  async setUserRoles(profileId: string, roles: string[], ttl?: number) {
    await this.set(profileId, JSON.stringify(roles), ttl);
  }

  async delUserRoles(profileId: string) {
    await this.del(profileId);
  }
}
