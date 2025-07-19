import { createParamDecorator } from '@nestjs/common';
import { computeRoles } from '@utils/user.util';

export const GetUser = createParamDecorator((data, context): User => {
  const req = context.switchToHttp().getRequest();
  let user = req.user;

  if (user) {
    user = computeRoles(user);
  }

  return user;
});
