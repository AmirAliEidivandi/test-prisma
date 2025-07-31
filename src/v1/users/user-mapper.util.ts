import { User } from '@prisma/client';
import { ProfileDto } from '../profiles/interfaces/profile.interface';
import { ResponseUserWithProfileDto } from './dto/response-user-with-profile.dto';

/**
 * Maps a user entity and a profile entity to a combined response DTO
 */
export function mapUserWithProfile(
  user: User,
  profile?: ProfileDto,
): ResponseUserWithProfileDto {
  return {
    id: user.id,
    profileId: user.profileId,
    jobPosition: user.jobPosition,
    phone: user.phone,
    address: user.address,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt,
    profile: profile
      ? {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          nationalCode: profile.nationalCode,
          email: profile.email,
          birthDate: profile.birthDate,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          deletedAt: profile.deletedAt,
        }
      : undefined,
  };
}
