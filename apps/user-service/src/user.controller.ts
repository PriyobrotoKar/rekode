import { Controller } from '@nestjs/common';
import {
  CreateUserIfNotExistsRequest,
  CreateUserIfNotExistsResponse,
  GetUserRequest,
  GetUserResponse,
  UserServiceController,
  UserServiceControllerMethods,
} from '@rekode/types/server/proto/user';
import { Observable } from 'rxjs';

import { UserService } from './user.service';

@Controller()
@UserServiceControllerMethods()
export class UserController implements UserServiceController {
  constructor(private readonly userService: UserService) {}

  createUserIfNotExists(
    request: CreateUserIfNotExistsRequest,
  ):
    | Promise<CreateUserIfNotExistsResponse>
    | Observable<CreateUserIfNotExistsResponse>
    | CreateUserIfNotExistsResponse {
    return this.userService.createUserIfNotExists(request);
  }

  getUser(
    request: GetUserRequest,
  ): Promise<GetUserResponse> | Observable<GetUserResponse> | GetUserResponse {
    return this.userService.getUser(request.id);
  }
}
