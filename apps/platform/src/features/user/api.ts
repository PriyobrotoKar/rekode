import type {
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from '@rekode/types/client/proto/user';

import { ApiClient } from '@/lib/api-client';

export class UserController {
  private static readonly apiClient: ApiClient = new ApiClient('/user');

  static async getSelf(): Promise<GetUserResponse> {
    return this.apiClient.get('/self');
  }

  static async updateSelf(data: Omit<UpdateUserRequest, 'id'>): Promise<UpdateUserResponse> {
    return this.apiClient.patch('/self', data);
  }
}
