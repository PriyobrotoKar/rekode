import { Controller } from '@nestjs/common';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  LoginWithEmailRequest,
  LoginWithEmailResponse,
  LoginWithOAuthRequest,
  LoginWithOAuthResponse,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  VerifyRefreshTokenRequest,
  VerifyRefreshTokenResponse,
} from '@rekode/types/server/proto/auth';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

@Controller()
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  loginWithEmail(
    request: LoginWithEmailRequest,
  ): Promise<LoginWithEmailResponse> | Observable<LoginWithEmailResponse> | LoginWithEmailResponse {
    return this.authService.loginWithEmail(request.email);
  }

  verifyOtp(
    request: VerifyOtpRequest,
  ): Promise<VerifyOtpResponse> | Observable<VerifyOtpResponse> | VerifyOtpResponse {
    return this.authService.verifyOtp(request);
  }

  loginWithOAuth(
    request: LoginWithOAuthRequest,
  ): Promise<LoginWithOAuthResponse> | Observable<LoginWithOAuthResponse> | LoginWithOAuthResponse {
    return this.authService.loginWithOAuth(request);
  }

  verifyRefreshToken(
    request: VerifyRefreshTokenRequest,
  ):
    | Promise<VerifyRefreshTokenResponse>
    | Observable<VerifyRefreshTokenResponse>
    | VerifyRefreshTokenResponse {
    return this.authService.verifyRefreshToken(request);
  }

  refreshToken(
    request: RefreshTokenRequest,
  ): Promise<RefreshTokenResponse> | Observable<RefreshTokenResponse> | RefreshTokenResponse {
    return this.authService.refreshToken(request);
  }

  logout(
    request: LogoutRequest,
  ): Promise<LogoutResponse> | Observable<LogoutResponse> | LogoutResponse {
    return this.authService.logout(request);
  }
}
