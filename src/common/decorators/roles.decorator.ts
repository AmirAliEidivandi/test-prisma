import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[] | [string[]]) => {
  const flatRoles = Array.isArray(roles[0]) ? roles[0] : roles;
  return SetMetadata('app_roles', flatRoles);
};
