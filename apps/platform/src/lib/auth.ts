import { setAppSession } from '@/features/auth/lib/session';
import type { RefreshTokenResponse } from '@rekode/types/client/proto/auth';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeaders, setCookie } from '@tanstack/react-start/server';
import ms, { type StringValue } from 'ms';

const AUTH_BASE_URL = 'http://localhost:8000/auth';

async function requestRefreshToken(
  headers?: Record<string, string>,
): Promise<RefreshTokenResponse> {
  const res = await fetch(AUTH_BASE_URL + '/refresh-token', {
    method: 'POST',
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message ?? 'Unable to refresh token');
  }

  return (await res.json()) as RefreshTokenResponse;
}

export const refreshTokens = createIsomorphicFn()
  .server(async () => {
    const data = await requestRefreshToken({
      Cookie: getRequestHeaders().get('Cookie') ?? '',
    });

    try {
      setCookie('access_token', data.accessToken, {
        domain: '.' + (process.env.DOMAIN ?? 'localhost'),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ms(process.env.JWT_EXPIRES_IN as StringValue) * 1000,
      });

      setCookie('refresh_token', data.refreshToken, {
        domain: '.' + (process.env.DOMAIN ?? 'localhost'),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ms(process.env.REFRESH_JWT_EXPIRES_IN as StringValue) * 1000,
      });

      await setAppSession({
        data: {
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        },
      });

      return {
        Cookie: `access_token=${data.accessToken}; refresh_token=${data.refreshToken}`,
      };
    } catch (error) {
      console.error('Error in setting cookies:', error);
      throw error;
    }
  })
  .client(() => requestRefreshToken());
