import { Transform } from 'class-transformer';
import { IsDate, IsEmail, IsString, IsUUID } from 'class-validator';

export class UserProfileResponseDto {
  @IsString()
  @IsUUID()
  requestId: string;

  @IsString()
  _id: string; // profileId from the other microservice

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  nationalCode: string;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  birthDate: Date;
}
