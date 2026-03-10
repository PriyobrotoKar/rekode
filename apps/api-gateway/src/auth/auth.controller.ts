import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  OnModuleInit,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import {
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  OAuthProvider,
} from '@rekode/types/server/proto/auth';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { firstValueFrom } from 'rxjs';

import { EmailLoginDto } from './dto/email-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { GoogleAuthGuard } from './guard/google.guard';
import { GoogleUser } from './types/google-user';

@Controller('auth')
export class AuthController implements OnModuleInit {
  private authService!: AuthServiceClient;
  constructor(@Inject(AUTH_PACKAGE_NAME) private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  @HttpCode(HttpStatus.OK)
  @Post('email')
  loginWithEmail(@Body() dto: EmailLoginDto) {
    return this.authService.loginWithEmail(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  loginWithGoogle() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async handleGoogleCallback(
    @Req() { user }: FastifyRequest & { user: GoogleUser },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const data = await firstValueFrom(
      this.authService.loginWithOAuth({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        profilePicture: user.picture,
        accountId: user.accountId,
        provider: OAuthProvider.O_AUTH_PROVIDER_GOOGLE,
      }),
    );

    return res
      .status(302)
      .redirect(
        `http://localhost:3000/auth/login?success=true&accessToken=${data.accessToken}&refreshToken=${data.refreshToken}&provider=${OAuthProvider.O_AUTH_PROVIDER_GOOGLE}`,
      );
  }
}
