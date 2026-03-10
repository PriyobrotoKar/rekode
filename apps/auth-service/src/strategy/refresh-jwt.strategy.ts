import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { jwtExtractor } from '@/lib/utils';

import refreshJwtConfig from '../config/refresh-jwt.config';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
  ) {
    super({
      jwtFromRequest: (req: Request) => jwtExtractor(req, 'refresh_token'),
      ignoreExpiration: false,
      secretOrKey: refreshJwtConfiguration.secret as string,
      passReqToCallback: true,
    });
  }

  validate(req: Request) {
    jwtExtractor(req, 'refresh_token')!;
    // return this.authService.validateRefreshToken(refreshToken, payload);
  }
}
