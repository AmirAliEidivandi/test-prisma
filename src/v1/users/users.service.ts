import { UserException } from '@exceptions/index';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserResponse } from '@responses/index';
import { PrismaService } from '@services/prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private userResponse: UserResponse;
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    this.userResponse = new UserResponse(this.i18n);
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { nationalCode: createUserDto.nationalCode },
          { email: createUserDto.email },
        ],
      },
    });
    if (existingUser) {
      if (existingUser.nationalCode === createUserDto.nationalCode) {
        throw UserException.alreadyExistsNationalCode(
          createUserDto.nationalCode,
        );
      }
      if (existingUser.email === createUserDto.email) {
        throw UserException.alreadyExistsEmail(createUserDto.email);
      }
    }

    const user = await this.prisma.user.create({
      data: createUserDto,
    });

    return this.userResponse.created(user);
  }

  async findAll(queryUserDto: QueryUserDto) {
    const { search, page, limit } = queryUserDto;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { nationalCode: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          firstName: true,
          email: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
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
