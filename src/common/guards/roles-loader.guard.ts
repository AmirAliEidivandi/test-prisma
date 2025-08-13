import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRolesService } from '@services/auth/user-roles.service';

@Injectable()
export class RolesLoaderGuard implements CanActivate {
  constructor(private readonly userRolesService: UserRolesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user: User | undefined = req?.user;

    if (!user) {
      return true;
    }

    try {
      await this.userRolesService.ensureUserRoles(user);
    } catch {}

    return true;
  }
}
