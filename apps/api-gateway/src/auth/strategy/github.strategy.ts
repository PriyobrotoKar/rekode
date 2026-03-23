import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

import { OAuthUser } from '../types/oauth-user';

export const GithubOAuthStrategyName = 'github';

@Injectable()
export class GithubOAuthStrategy extends PassportStrategy(Strategy, GithubOAuthStrategyName) {
  constructor(readonly config: ConfigService) {
    const clientID = config.getOrThrow<string>('GITHUB_OAUTH_CLIENT_ID');
    const clientSecret = config.getOrThrow<string>('GITHUB_OAUTH_CLIENT_SECRET');
    const callbackURL = config.getOrThrow<string>('GITHUB_OAUTH_CALLBACK_URL');

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email', 'read:user'],
    });
  }

  validate(_: string, __: string, profile: Profile): OAuthUser {
    const { displayName, emails, photos } = profile;

    const email = emails?.[0]?.value;
    const profilePicture = photos?.[0]?.value;

    if (!email || !displayName || !profilePicture) {
      throw new Error('Invalid Google profile');
    }

    const user = {
      email,
      firstName: displayName.split(' ')[0]!,
      lastName: displayName.split(' ')[1]!,
      picture: profilePicture,
      accountId: profile.id,
    };

    return user;
  }
}
