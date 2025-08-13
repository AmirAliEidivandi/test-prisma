import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  async (data, context: ExecutionContext): Promise<User> => {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    return user;
  },
);
