import { KafkaServiceConstants } from '@constants/kafka.constants';
import { Roles } from '@decorators/roles.decorator';
import { GetUser } from '@decorators/user.decorator';
import { KeycloakRoleEnum } from '@enums/keycloak-role-enum';
import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserResponseDto } from './dto/response-user.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @EventPattern(KafkaServiceConstants.TOPICS.REGISTERED_USER)
  registeredUser(@Payload() payload: string) {
    return this.usersService.registeredUser(payload);
  }

  @ApiOperation({ summary: 'Get user info' })
  @ApiResponse({
    status: 200,
    description: 'User info',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Roles(KeycloakRoleEnum.VIEW_PEOPLE_SELF)
  @Get('info')
  getInfo(@GetUser() user: User) {
    return this.usersService.getInfo(user);
  }
}
