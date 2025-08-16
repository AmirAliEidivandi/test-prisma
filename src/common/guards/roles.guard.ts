import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRolesService } from '@services/auth/user-roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRolesService: UserRolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'app_roles',
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }

    const user: User = context.switchToHttp().getRequest().user;
    let roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    if (roles.length === 0) {
      try {
        await this.userRolesService.ensureUserRoles(user);
        roles = Array.isArray(user?.roles) ? user.roles : [];
      } catch {}
      if (roles.length === 0) {
        return false;
      }
    }

    const roleSet = new Set(roles);
    return requiredRoles.some((role) => roleSet.has(role));
  }
}
