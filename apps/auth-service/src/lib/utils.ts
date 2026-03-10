import { Request } from 'express';

export const jwtExtractor = (req: Request, type: 'access_token' | 'refresh_token') => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.cookies) {
    const cookies = req.cookies as Record<string, string>;
    token = cookies[type];
  }

  return token ?? null;
};
