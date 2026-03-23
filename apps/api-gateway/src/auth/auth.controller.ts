import { CurrentUser } from '@/decorators/current-user.decorator';
import { Public } from '@/decorators/public.decorator';
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
import { GithubAuthGuard } from './guard/github.guard';
import { GoogleAuthGuard } from './guard/google.guard';
import { RefreshJwtAuthGuard } from './guard/refresh-auth.guard';
import { removeCookies, setCookies } from './lib/utils';
import { type JwtPayload } from './types/jwt-payload';
import { OAuthUser } from './types/oauth-user';

@Controller('auth')
export class AuthController implements OnModuleInit {
  private authService!: AuthServiceClient;
  constructor(@Inject(AUTH_PACKAGE_NAME) private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('email')
  loginWithEmail(@Body() dto: EmailLoginDto) {
    return this.authService.loginWithEmail(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: FastifyReply) {
    const token = await firstValueFrom(this.authService.verifyOtp(dto));

    setCookies(res, {
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
    });

    return token;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh-token')
  async refreshToken(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const token = await firstValueFrom(this.authService.refreshToken(user));

    setCookies(res, {
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
    });

    return token;
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: FastifyReply) {
    this.authService.logout({ id: user.id });
    removeCookies(res);
    return {
      message: 'Logged out successfully',
    };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  loginWithGoogle() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async handleGoogleCallback(
    @Req() { user }: FastifyRequest & { user: OAuthUser },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.handleOAuthCallback(user, OAuthProvider.O_AUTH_PROVIDER_GOOGLE, res);
  }

  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  loginWithGithub() {}

  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async handleGithubCallback(
    @Req() { user }: FastifyRequest & { user: OAuthUser },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.handleOAuthCallback(user, OAuthProvider.O_AUTH_PROVIDER_GITHUB, res);
  }

  private async handleOAuthCallback(user: OAuthUser, provider: OAuthProvider, res: FastifyReply) {
    const data = await firstValueFrom(
      this.authService.loginWithOAuth({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        profilePicture: user.picture,
        accountId: user.accountId,
        provider,
      }),
    );

    setCookies(res, {
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
    });

    return res
      .status(302)
      .redirect(
        `http://localhost:3000/auth/login?success=true&accessToken=${data.accessToken}&refreshToken=${data.refreshToken}&provider=${provider}`,
      );
  }
}
