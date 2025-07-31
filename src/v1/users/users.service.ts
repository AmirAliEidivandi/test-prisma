import { UserException } from '@exceptions/index';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IBaseResponse, UserResponse } from '@responses/index';
import { PrismaService } from '@services/prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateUserWithProfileDto } from './dto/create-user-with-profile.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ResponseUserWithProfileDto } from './dto/response-user-with-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { mapUserWithProfile } from './user-mapper.util';

@Injectable()
export class UsersService {
  private userResponse: UserResponse;
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    private readonly i18n: I18nService,
  ) {
    this.userResponse = new UserResponse(this.i18n);
  }

  /**
   * Creates a new user with profile in the system
   * This method will first create a profile in the profile microservice
   * and then create a local user record with the profileId
   */
  async create(
    createUserWithProfileDto: CreateUserWithProfileDto,
  ): Promise<IBaseResponse<ResponseUserWithProfileDto>> {
    this.logger.log(
      `Creating user with profile: ${JSON.stringify(createUserWithProfileDto)}`,
    );

    try {
      // 1. Extract profile data from the DTO
      const profileData = {
        firstName: createUserWithProfileDto.firstName,
        lastName: createUserWithProfileDto.lastName,
        nationalCode: createUserWithProfileDto.nationalCode,
        email: createUserWithProfileDto.email,
        birthDate: createUserWithProfileDto.birthDate
          ? new Date(createUserWithProfileDto.birthDate)
          : undefined,
      };

      // 2. Create profile in the profile microservice
      const profile = await this.profilesService.createProfile(profileData);
      this.logger.log(`Profile created with ID: ${profile.id}`);

      // 3. Create local user record with profile ID
      const user = await this.prisma.user.create({
        data: {
          profileId: profile.id,
          jobPosition: createUserWithProfileDto.jobPosition,
          phone: createUserWithProfileDto.phone,
          address: createUserWithProfileDto.address,
        },
      });

      // 4. Map to combined response
      const response = mapUserWithProfile(user as any, profile);

      return this.userResponse.created(response);
    } catch (error) {
      this.logger.error(
        `Failed to create user with profile: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find a user by ID and include their profile data
   */
  async findOne(
    id: string,
  ): Promise<IBaseResponse<ResponseUserWithProfileDto>> {
    this.logger.log(`Finding user with profile, ID: ${id}`);

    try {
      // 1. Get the user record
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw UserException.notFound(id);
      }

      // 2. If profileId exists, get profile data from the microservice
      let profile = null;
      if (user.profileId) {
        try {
          profile = await this.profilesService.getProfile(user.profileId);
          this.logger.log(
            `Retrieved profile for user ${id}, profile ID: ${user.profileId}`,
          );
        } catch (profileError) {
          this.logger.error(
            `Failed to fetch profile for user ${id}: ${profileError.message}`,
          );
          // Continue without profile data if we can't retrieve it
        }
      }

      // 3. Map to combined response
      const response = mapUserWithProfile(user as any, profile);

      return this.userResponse.retrieved(response);
    } catch (error) {
      this.logger.error(
        `Failed to find user with profile: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all users with their profile data
   */
  async findAll(
    queryUserDto: QueryUserDto,
  ): Promise<IBaseResponse<ResponseUserWithProfileDto[]>> {
    const { page, limit } = queryUserDto;
    this.logger.log(
      `Finding all users with profiles, page: ${page}, limit: ${limit}`,
    );

    try {
      // 1. Get all users with pagination
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

      // 2. Collect all profileIds to fetch
      const profileIds = users
        .filter((user) => user.profileId)
        .map((user) => user.profileId);

      // 3. Fetch profiles in bulk if we have IDs
      let profilesMap = new Map();
      if (profileIds.length > 0) {
        try {
          const profilesResponse = await this.profilesService.getProfiles({
            ids: profileIds,
          });

          if (profilesResponse.success && profilesResponse.profiles) {
            // Create a map for easy lookup
            profilesResponse.profiles.forEach((profile) => {
              profilesMap.set(profile.id, profile);
            });
            this.logger.log(
              `Retrieved ${profilesMap.size} profiles for ${users.length} users`,
            );
          }
        } catch (profilesError) {
          this.logger.error(
            `Failed to fetch profiles: ${profilesError.message}`,
          );
          // Continue without profile data if we can't retrieve them
        }
      }

      // 4. Map each user with its profile
      const usersWithProfiles = users.map((user) => {
        const profile = user.profileId ? profilesMap.get(user.profileId) : null;
        return mapUserWithProfile(user as any, profile);
      });

      return this.userResponse.listed(
        usersWithProfiles,
        totalCount,
        page,
        limit,
      );
    } catch (error) {
      this.logger.error(
        `Failed to find all users with profiles: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update a user and their profile
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<IBaseResponse<ResponseUserWithProfileDto>> {
    this.logger.log(`Updating user with profile, ID: ${id}`);

    try {
      // 1. Get the current user record
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw UserException.notFound(id);
      }

      // 2. Extract profile-specific fields
      const {
        firstName,
        lastName,
        nationalCode,
        email,
        birthDate,
        ...localUserData
      } = updateUserDto as any;

      // 3. Update profile if needed and if we have a profileId
      let updatedProfile = null;
      if (
        existingUser.profileId &&
        (firstName || lastName || nationalCode || email || birthDate)
      ) {
        try {
          const profileUpdateData = {
            id: existingUser.profileId,
            firstName,
            lastName,
            nationalCode,
            email,
            birthDate: birthDate ? new Date(birthDate) : undefined,
          };

          updatedProfile =
            await this.profilesService.updateProfile(profileUpdateData);
          this.logger.log(
            `Updated profile for user ${id}, profile ID: ${existingUser.profileId}`,
          );
        } catch (profileError) {
          this.logger.error(
            `Failed to update profile for user ${id}: ${profileError.message}`,
          );
          // Continue with just updating local user data
        }
      }

      // 4. Update local user data
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: localUserData,
      });

      // 5. If we don't have the updated profile yet but we have a profileId, try to get it
      if (!updatedProfile && existingUser.profileId) {
        try {
          updatedProfile = await this.profilesService.getProfile(
            existingUser.profileId,
          );
        } catch (profileError) {
          this.logger.error(
            `Failed to fetch profile after update: ${profileError.message}`,
          );
        }
      }

      // 6. Map to combined response
      const response = mapUserWithProfile(updatedUser as any, updatedProfile);

      return this.userResponse.updated(response);
    } catch (error) {
      this.logger.error(
        `Failed to update user with profile: ${error.message}`,
        error.stack,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw UserException.notFound(id);
        }
      }

      throw error;
    }
  }

  /**
   * Delete a user and optionally their profile
   */
  async remove(
    id: string,
    deleteProfile = false,
  ): Promise<IBaseResponse<void>> {
    this.logger.log(
      `Removing user with ID: ${id}, deleteProfile: ${deleteProfile}`,
    );

    try {
      // 1. Get the user record to check if it has a profileId
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw UserException.notFound(id);
      }

      // 2. If requested and we have a profileId, delete the profile first
      if (deleteProfile && user.profileId) {
        try {
          await this.profilesService.deleteProfile(user.profileId);
          this.logger.log(`Deleted profile with ID: ${user.profileId}`);
        } catch (profileError) {
          this.logger.error(
            `Failed to delete profile: ${profileError.message}`,
          );
          // Continue with local deletion even if profile deletion fails
        }
      }

      // 3. Soft delete the local user record
      await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return this.userResponse.deleted();
    } catch (error) {
      this.logger.error(`Failed to remove user: ${error.message}`, error.stack);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw UserException.notFound(id);
        }
      }

      throw error;
    }
  }
}
