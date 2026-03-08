import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

import { GoogleUser } from '../types/google-user';

export const GoogleOAuthStrategyName = 'google';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, GoogleOAuthStrategyName) {
  constructor(readonly config: ConfigService) {
    const clientID = config.getOrThrow<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = config.getOrThrow<string>('GOOGLE_OAUTH_CLIENT_SECRET');
    const callbackURL = config.getOrThrow<string>('GOOGLE_OAUTH_CALLBACK_URL');

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(_: string, __: string, profile: Profile): GoogleUser {
    const { name, emails, photos } = profile;

    const email = emails?.[0]?.value;
    const profilePicture = photos?.[0]?.value;

    if (!email || !name || !profilePicture) {
      throw new Error('Invalid Google profile');
    }

    const user = {
      email,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: profilePicture,
      accountId: profile.id,
    };

    return user;
  }
}
