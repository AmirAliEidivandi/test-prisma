import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const user: User = context.switchToHttp().getRequest().user;
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    if (roles.length === 0) {
      return false;
    }

    const roleSet = new Set(roles);
    return requiredRoles.some((role) => roleSet.has(role));
  }
}
