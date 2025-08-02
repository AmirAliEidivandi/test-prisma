import { UserException } from '@exceptions/index';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserResponse } from '@responses/index';
import { ProfileKafkaService } from '@services/kafka/profile/profile-kafka.service';
import { PrismaService } from '@services/prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserResponseDto } from './dto/response-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private userResponse: UserResponse;
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly profileKafkaService: ProfileKafkaService,
  ) {
    this.userResponse = new UserResponse(this.i18n);
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        address: createUserDto.address,
        jobPosition: createUserDto.jobPosition,
        phone: createUserDto.phone,
      },
    });

    const profile = await this.profileKafkaService.createProfile(createUserDto);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        profileId: profile._id,
      },
    });
    const responseData: UserResponseDto = {
      ...updatedUser,
      profile: {
        id: profile._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        birthDate: profile.birthDate,
        nationalCode: profile.nationalCode,
      },
    };
    return this.userResponse.created(responseData);
  }

  async findAll(queryUserDto: QueryUserDto) {
    const { page, limit } = queryUserDto;

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
        },
        skip: page * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
        },
      }),
    ]);
    return this.userResponse.listed(users, totalCount, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      throw UserException.notFound(id);
    }
    return this.userResponse.retrieved(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      return this.userResponse.updated(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw UserException.notFound(id);
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.userResponse.deleted();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw UserException.notFound(id);
        }
      }
      throw error;
    }
  }
}
