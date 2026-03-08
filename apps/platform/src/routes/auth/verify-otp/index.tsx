import { VerifyOtpForm } from '@/features/auth/components/verify-otp-form';
import { createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

const verifyOtpSearchSchema = z.object({
  email: z.email(),
});

export const Route = createFileRoute('/auth/verify-otp/')({
  validateSearch: verifyOtpSearchSchema,
  component: RouteComponent,
  onError: (error) => {
    if (error.routerCode === 'VALIDATE_SEARCH') {
      throw redirect({
        to: '/auth/login',
      });
    }
    throw error;
  },
});

function RouteComponent() {
  const { email } = Route.useSearch();

  return <VerifyOtpForm email={email} />;
}
