import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { jwtExtractor } from '@/lib/utils';

import jwtConfig from '../config/jwt.config';
import { JWTPayload } from '../types/jwt.payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY)
    jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: (req: Request) => jwtExtractor(req, 'access_token'),
      ignoreExpiration: false,
      secretOrKey: jwtConfiguration.secret as string,
    });
  }

  validate(payload: JWTPayload) {
    return { id: payload.id, email: payload.email };
  }
}
