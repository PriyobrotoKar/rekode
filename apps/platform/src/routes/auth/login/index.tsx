import { SignInForm } from '@/features/auth/components/sign-in-form';
import { getPreviousAppSession, setAppSession } from '@/features/auth/lib/session';
import { OAuthProvider } from '@rekode/types/client/proto/auth';
import { createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

const signInParamsSchema = z.object({
  success: z.boolean().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  provider: z.enum(OAuthProvider).optional(),
});

export const Route = createFileRoute('/auth/login/')({
  validateSearch: signInParamsSchema,
  loaderDeps: ({ search }) => {
    return {
      success: search.success ?? undefined,
      accessToken: search.accessToken ?? undefined,
      refreshToken: search.refreshToken ?? undefined,
      provider: search.provider ?? undefined,
    };
  },
  loader: async ({ deps }) => {
    const prevSession = await getPreviousAppSession();
    if (Object.values(deps).some((v) => v === undefined)) {
      return { prevSession };
    }
    await setAppSession({
      data: {
        access_token: deps.accessToken!,
        refresh_token: deps.refreshToken!,
        provider: deps.provider!,
      },
    });
    throw redirect({
      to: '/',
      reloadDocument: true,
    });
  },
  component: SignInPage,
});

function SignInPage() {
  return <SignInForm />;
}
