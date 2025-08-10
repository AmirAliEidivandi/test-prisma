import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { UserUtil } from '@utils/user.util';

let moduleRefInstance: ModuleRef;

export function setModuleRef(moduleRef: ModuleRef) {
  moduleRefInstance = moduleRef;
}

export const GetUser = createParamDecorator(
  async (data, context: ExecutionContext): Promise<User> => {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    try {
      if (moduleRefInstance) {
        const userUtil = moduleRefInstance.get(UserUtil, { strict: false });
        if (userUtil) {
          return await userUtil.computeRoles(user);
        }
      }
    } catch (error) {
      return user;
    }
  },
);
