import { UserException } from '@exceptions/index';
import { Injectable } from '@nestjs/common';
import { ProfileKafkaService } from '@services/kafka/profile/profile-kafka.service';
import { PrismaService } from '@services/prisma/prisma.service';
import { decrypt } from '@utils/encryption.util';
import { UserResponseDto } from './dto/response-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileKafkaService: ProfileKafkaService,
  ) {}

  async registeredUser(payload: string) {
    const { kid, profile_id } = decrypt(payload) as {
      kid: string;
      profile_id: string;
    };
    await this.prisma.user.create({
      data: {
        kid,
        profile_id,
      },
    });
  }

  async getInfo(user: User) {
    const findUser = await this.prisma.user.findFirst({
      where: {
        kid: user.sub,
      },
    });
    if (!findUser) {
      throw UserException.notFound(findUser.id);
    }
    const profile = await this.profileKafkaService.findOneProfile(
      findUser.profile_id,
      // ['first_name', 'last_name', 'email', 'username'],
      ['*'],
    );
    const userResponse: UserResponseDto = {
      ...findUser,
      profile,
    };
    return userResponse;
  }
}
