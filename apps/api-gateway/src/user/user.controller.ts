import { type JwtPayload } from '@/auth/types/jwt-payload';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { Body, Controller, Get, Inject, Patch, Post } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import {
  type CreateUserIfNotExistsRequest,
  USER_PACKAGE_NAME,
  USER_SERVICE_NAME,
  UserServiceClient,
} from '@rekode/types/server/proto/user';

import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  private userService!: UserServiceClient;
  constructor(@Inject(USER_PACKAGE_NAME) private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @Post()
  createUserIfNotExists(request: CreateUserIfNotExistsRequest) {
    return this.userService.createUserIfNotExists(request);
  }

  @Get('self')
  getSelf(@CurrentUser() user: JwtPayload) {
    return this.userService.getUser({ id: user.id });
  }

  @Patch('self')
  updateSelf(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser({ ...dto, id: user.id });
  }
}
