import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { GoogleOAuthStrategyName } from '../strategy/google.strategy';

@Injectable()
export class GoogleAuthGuard extends AuthGuard(GoogleOAuthStrategyName) {}
