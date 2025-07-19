import { ConfigModule } from '@nestjs/config';
import * as process from 'node:process';

const computeRoles = (user: User): User => {
  ConfigModule.envVariablesLoaded;
  user.roles = [];
  const resource = Object.keys(user.resource_access).includes(
    process.env.KEYCLOAK_CLIENT_ID,
  );
  if (resource) {
    user.roles = user.resource_access[process.env.KEYCLOAK_CLIENT_ID].roles;
  }
  return user;
};

export { computeRoles };
