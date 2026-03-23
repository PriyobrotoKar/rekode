import { AuthLayout } from '@/features/auth/components/auth-layout';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/auth')({
  loader: async ({ context, location }) => {
    if (context.user) {
      console.log(
        location,
        context.user.name,
        !context.user.name && location.pathname !== '/auth/profile',
      );
      if (!context.user.name && location.pathname === '/auth/profile') {
        return;
      }

      throw redirect({
        to: '/',
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}
