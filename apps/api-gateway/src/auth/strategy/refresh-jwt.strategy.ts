import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type ClientGrpc } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import {
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  AuthServiceClient,
} from '@rekode/types/server/proto/auth';
import type { FastifyRequest } from 'fastify';
import { Strategy } from 'passport-jwt';
import { firstValueFrom } from 'rxjs';

import { jwtExtractor } from '../lib/utils';
import { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class RefreshJwtStrategy
  extends PassportStrategy(Strategy, 'refresh-jwt')
  implements OnModuleInit
{
  private authService!: AuthServiceClient;
  constructor(
    readonly config: ConfigService,
    @Inject(AUTH_PACKAGE_NAME) private client: ClientGrpc,
  ) {
    super({
      jwtFromRequest: (req: FastifyRequest) => jwtExtractor(req, 'refresh_token'),
      ignoreExpiration: false,
      secretOrKey: config.get('REFRESH_JWT_SECRET') as string,
      passReqToCallback: true,
    });
  }

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async validate(req: FastifyRequest, payload: JwtPayload) {
    const refreshToken = jwtExtractor(req, 'refresh_token')!;
    console.log('payload', payload, 'refreshToken', refreshToken);
    return await firstValueFrom(
      this.authService.verifyRefreshToken({ oldRefreshToken: refreshToken, id: payload.id }),
    );
  }
}
