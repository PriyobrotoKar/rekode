import { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply, FastifyRequest } from 'fastify';
import ms, { StringValue } from 'ms';

export const jwtExtractor = (req: FastifyRequest, type: 'access_token' | 'refresh_token') => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  console.log(req.cookies);

  if (!token && req.cookies) {
    const cookies = req.cookies as Record<string, string>;
    token = cookies[type];
  }

  return token ?? null;
};

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions: CookieSerializeOptions = {
  ...(isProd && process.env.DOMAIN ? { domain: process.env.DOMAIN } : {}),
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
};

export const setCookies = (
  res: FastifyReply,
  token: {
    access_token: string;
    refresh_token: string;
  },
) => {
  const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '10m') as StringValue;
  const REFRESH_TOKEN_EXPIRES_IN = (process.env.REFRESH_JWT_EXPIRES_IN ?? '1d') as StringValue;

  res.setCookie('access_token', token.access_token, {
    ...cookieOptions,
    maxAge: ms(JWT_EXPIRES_IN) / 1000,
  });

  res.setCookie('refresh_token', token.refresh_token, {
    ...cookieOptions,
    maxAge: ms(REFRESH_TOKEN_EXPIRES_IN) / 1000,
  });
};

export const removeCookies = (res: FastifyReply) => {
  res.clearCookie('access_token', { path: cookieOptions.path });
  res.clearCookie('refresh_token', { path: cookieOptions.path });
};
