import type { UpdateUserRequest } from '@rekode/types/client/proto/user';
import { mutationOptions } from '@tanstack/react-query';

import { UserController } from './api';

export const updateProfileMutationOptions = mutationOptions({
  mutationFn: async (data: Omit<UpdateUserRequest, 'id'>) => UserController.updateSelf(data),
});
