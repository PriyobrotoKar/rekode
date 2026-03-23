import type {
  LoginWithEmailResponse,
  LogoutResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@rekode/types/client/proto/auth';

import { ApiClient } from '@/lib/api-client';

export class AuthController {
  private static readonly apiClient: ApiClient = new ApiClient('/auth');

  static async loginWithEmail(email: string): Promise<LoginWithEmailResponse> {
    return this.apiClient.post('/email', { email });
  }

  static async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    return this.apiClient.post('/verify-otp', data);
  }

  static async logout(): Promise<LogoutResponse> {
    return this.apiClient.post('/logout', undefined, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
