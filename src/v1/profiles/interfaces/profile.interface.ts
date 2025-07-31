export interface ProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  nationalCode: string;
  email: string;
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateProfileRequest {
  firstName?: string;
  lastName?: string;
  nationalCode?: string;
  email?: string;
  birthDate?: Date;
}

export interface CreateProfileResponse {
  success: boolean;
  profile?: ProfileDto;
  error?: string;
}

export interface GetProfileRequest {
  id: string;
}

export interface GetProfileResponse {
  success: boolean;
  profile?: ProfileDto;
  error?: string;
}

export interface GetProfilesRequest {
  ids?: string[];
  page?: number;
  limit?: number;
}

export interface GetProfilesResponse {
  success: boolean;
  profiles: ProfileDto[];
  total: number;
  page: number;
  limit: number;
  error?: string;
}

export interface UpdateProfileRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  nationalCode?: string;
  email?: string;
  birthDate?: Date;
}

export interface UpdateProfileResponse {
  success: boolean;
  profile?: ProfileDto;
  error?: string;
}

export interface DeleteProfileRequest {
  id: string;
}

export interface DeleteProfileResponse {
  success: boolean;
  error?: string;
}
