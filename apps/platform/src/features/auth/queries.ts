import type { VerifyOtpRequest } from '@rekode/types/client/proto/auth';
import { mutationOptions } from '@tanstack/react-query';

import { AuthController } from './api';

export const loginWithEmailMutationOptions = mutationOptions({
  mutationFn: async (email: string) => AuthController.loginWithEmail(email),
});

export const verifyOtpMutationOptions = mutationOptions({
  mutationFn: async (data: VerifyOtpRequest) => AuthController.verifyOtp(data),
});

export const logoutMutationOptions = mutationOptions({
  mutationFn: async () => AuthController.logout(),
});
