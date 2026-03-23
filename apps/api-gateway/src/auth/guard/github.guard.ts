import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { GithubOAuthStrategyName } from '../strategy/github.strategy';

@Injectable()
export class GithubAuthGuard extends AuthGuard(GithubOAuthStrategyName) {}
