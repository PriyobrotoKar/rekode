import { status } from '@grpc/grpc-js';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type ClientGrpc, ClientKafka, RpcException } from '@nestjs/microservices';
import {
  LoginWithOAuthRequest,
  LogoutRequest,
  OAuthProvider,
  RefreshTokenRequest,
  VerifyOtpRequest,
  VerifyRefreshTokenRequest,
} from '@rekode/types/server/proto/auth';
import {
  USER_PACKAGE_NAME,
  USER_SERVICE_NAME,
  UserServiceClient,
} from '@rekode/types/server/proto/user';
import argon2 from 'argon2';
import ms, { StringValue } from 'ms';
import crypto from 'node:crypto';
import { firstValueFrom, lastValueFrom } from 'rxjs';

import refreshJwtConfig from './config/refresh-jwt.config';
import { AuthProvider } from './generated/prisma/enums';
import { PrismaService } from './prisma/prisma.service';
import { JWTPayload } from './types/jwt.payload';

const MAX_FAILED_ATTEMPTS = 5;
const OTP_EXPIRES_IN = 60 * 1000; // 1 min

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private userService: UserServiceClient;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    @Inject(refreshJwtConfig.KEY)
    private readonly refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    @Inject(USER_PACKAGE_NAME) private readonly userClient: ClientGrpc,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.userService = this.userClient.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  async loginWithEmail(email: string) {
    this.logger.log(`User requested to login with email:${email}`);

    const otp = await this.generateOTP(email);

    this.kafkaClient.emit('auth.login_otp_requested', { email, otp: otp.toString() });

    return {
      message: `OTP has been sent to email ${email}. Please verify it to login.`,
    };
  }

  async verifyOtp({ email, otp }: VerifyOtpRequest) {
    this.logger.log(`User requested to verify OTP for email: ${email}`);

    const correctOtp = await this.cacheManager.get<string>(`otp:${email}`);

    if (!correctOtp) {
      this.logger.error(`No OTP has been requested or has expired for email ${email}`);
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'OTP has expired or not requested yet',
      });
    }

    const isOtpCorrect = otp === correctOtp;

    if (!isOtpCorrect) {
      this.logger.error(`OTP ${otp} is incorrect for email ${email}`);

      const failedAttempts = await this.cacheManager.get<number>(`incorrect-otp-attempts:${email}`);

      if (!failedAttempts) {
        await this.cacheManager.set(`incorrect-otp-attempts:${email}`, 1, OTP_EXPIRES_IN);
      } else if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        this.logger.log(`Maximum OTP verification attempts reached for email ${email}`);

        await this.deleteOtp(email);

        throw new RpcException({
          code: status.PERMISSION_DENIED,
          message: 'Too many failed attempts. A new OTP can now be requested.',
        });
      } else {
        await this.cacheManager.set(
          `incorrect-otp-attempts:${email}`,
          failedAttempts + 1,
          OTP_EXPIRES_IN,
        );
      }

      const retriesLeft = MAX_FAILED_ATTEMPTS - (failedAttempts ? failedAttempts + 1 : 1);

      this.logger.log(`${retriesLeft} OTP verify requests left for email ${email}`);

      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Entered OTP is incorrect. Please try again.',
      });
    }

    this.logger.log(`OTP verified for email ${email}`);

    await this.deleteOtp(email);

    const { user } = await lastValueFrom(this.userService.createUserIfNotExists({ email }));

    if (!user) {
      this.logger.log(`User not found for email ${email}`);
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'User not found. Please try again.',
      });
    }

    await this.createAccountIfNotExists(email, 'EMAIL', user.id);

    const payload: JWTPayload = {
      email: user.email,
      id: user.id,
    };

    const [access_token, refresh_token] = await this.generateTokens(payload);

    await this.updateRefreshToken(payload.id, refresh_token);

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
    };
  }

  async loginWithOAuth({
    email,
    name,
    profilePicture,
    accountId,
    provider,
  }: LoginWithOAuthRequest) {
    this.logger.log(`User with email ${email} requested to login with OAuth ${provider}`);

    if (
      provider === OAuthProvider.UNRECOGNIZED ||
      provider === OAuthProvider.O_AUTH_PROVIDER_UNSPECIFIED
    ) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Invalid OAuth provider',
      });
    }

    const { user } = await firstValueFrom(
      this.userService.createUserIfNotExists({ email, name, image: profilePicture }),
    );

    if (!user) {
      this.logger.error(`Failed to create user with email ${email}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to create user',
      });
    }

    const providerMap = {
      '1': AuthProvider.GOOGLE,
      '2': AuthProvider.GITHUB,
    };

    await this.createAccountIfNotExists(accountId, providerMap[provider], user.id);

    const payload: JWTPayload = {
      email: user.email,
      id: user.id,
    };

    const [accessToken, refreshToken] = await this.generateTokens(payload);

    await this.updateRefreshToken(payload.id, refreshToken);

    return { accessToken, refreshToken };
  }

  private async createAccountIfNotExists(
    accountId: string,
    provider: AuthProvider,
    userId: string,
  ) {
    const account = await this.prisma.account.findUnique({
      where: {
        providerId_accountId: {
          providerId: provider,
          accountId,
        },
      },
    });

    if (!account) {
      await this.prisma.account.create({
        data: {
          userId,
          accountId,
          providerId: provider,
        },
      });
    }

    return account;
  }

  private async generateOTP(email: string) {
    const code = crypto.randomInt(100000, 999999);

    await this.cacheManager.set(`otp:${email}`, code.toString(), OTP_EXPIRES_IN);

    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_IN);

    this.logger.log(
      `OTP generated for email ${email} which will be valid till ${otpExpiresAt.toLocaleTimeString()}`,
    );
    this.logger.debug(`OTP ${code} has been generated for email ${email}`);

    return code;
  }

  async verifyRefreshToken({ oldRefreshToken, id }: VerifyRefreshTokenRequest) {
    this.logger.log(`Validating refresh token for user ${id}`);

    const { user } = await firstValueFrom(this.userService.getUser({ id }));

    if (!user) {
      this.logger.error(`User not found for id ${id}`);
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'User not found',
      });
    }

    const hashedRefreshToken = await this.cacheManager.get<string>(`REFRESH_TOKEN:${user.id}`);

    if (!hashedRefreshToken) {
      this.logger.error(`Refresh token not found for user ${id}`);
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Refresh token not found',
      });
    }

    const isRefreshTokenValid = await argon2.verify(hashedRefreshToken, oldRefreshToken);

    if (!isRefreshTokenValid) {
      this.logger.error(`Invalid refresh token for user ${id}`);
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid refresh token',
      });
    }

    return {
      id: user.id,
      email: user.email,
    };
  }

  async refreshToken({ id, email }: RefreshTokenRequest) {
    this.logger.log(`User ${id} requested to refresh token`);

    const [accessToken, refreshToken] = await this.generateTokens({ id, email });

    await this.updateRefreshToken(id, refreshToken);

    return { accessToken, refreshToken };
  }

  async logout({ id }: LogoutRequest) {
    this.logger.log(`User ${id} requested to logout`);
    await this.cacheManager.del(`REFRESH_TOKEN:${id}`);
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(payload: JWTPayload) {
    const tokens = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(payload, this.refreshJwtConfiguration),
    ]);

    return tokens;
  }

  private async deleteOtp(email: string) {
    await this.cacheManager.del(`otp:${email}`);
    await this.cacheManager.del(`INCORRECT_OTP_COUNT:${email}`);

    this.logger.log(`OTP deleted for email ${email}`);
  }

  private async updateRefreshToken(userId: string, refresh_token: string) {
    const hashedRefreshToken = await argon2.hash(refresh_token);

    const refreshTokenExpiry = this.refreshJwtConfiguration.expiresIn as StringValue;

    const expiresIn = ms(refreshTokenExpiry);

    await this.cacheManager.set(`REFRESH_TOKEN:${userId}`, hashedRefreshToken, expiresIn);
  }
}
