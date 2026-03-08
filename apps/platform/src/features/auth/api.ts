import type {
  LoginWithEmailResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@rekode/types/proto/auth';

import { ApiClient } from '@/lib/api-client';

export class AuthController {
  private static readonly apiClient: ApiClient = new ApiClient('/auth');

  static async loginWithEmail(email: string): Promise<LoginWithEmailResponse> {
    return this.apiClient.post('/email', { email });
  }

  static async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    return this.apiClient.post('/verify-otp', data);
  }
}
