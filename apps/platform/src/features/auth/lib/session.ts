import type { OAuthProvider } from '@rekode/types/client/proto/auth';
import { createServerFn } from '@tanstack/react-start';
import { useSession } from '@tanstack/react-start/server';
import ms, { type StringValue } from 'ms';

type SessionData = {
  access_token: string;
  refresh_token: string;
};

type PreviousSessionData = {
  provider: OAuthProvider;
};

function usePreviousAppSession(): ReturnType<typeof useSession<PreviousSessionData>> {
  return useSession<PreviousSessionData>({
    name: 'prev-session',
    password: process.env.SESSION_SECRET!,
    cookie: {
      httpOnly: true,
    },
  });
}

function useAppSession(): ReturnType<typeof useSession<SessionData>> {
  const refreshTokenExpiresIn = (process.env.REFRESH_JWT_EXPIRES_IN ?? '7d') as StringValue;
  const expiresIn = ms(refreshTokenExpiresIn);

  return useSession<SessionData>({
    // Session configuration
    name: 'app-session',
    password: process.env.SESSION_SECRET!, // At least 32 characters
    // Optional: customize cookie settings
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: expiresIn / 1000,
    },
  });
}

export const setAppSession = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { access_token: string; refresh_token: string; provider?: OAuthProvider }) => data,
  )
  .handler(async ({ data }) => {
    console.log('Setting session', data);
    const session = await useAppSession();
    const prevSession = await usePreviousAppSession();

    await session.update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (data.provider) {
      await prevSession.update({
        provider: data.provider,
      });
    }
  });

export const removeAppSession = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession();
  await session.clear();
});

export const getAppSession = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await useAppSession();
  return session.data;
});

export const getPreviousAppSession = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await usePreviousAppSession();
  return session.data;
});
