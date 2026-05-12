import { Outlet } from '@tanstack/react-router';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected')({
  loader: async ({ context }) => {
    if (!context.user) {
      throw redirect({
        to: '/auth/login',
      });
    }
    if (!context.user.name) {
      throw redirect({
        to: '/auth/profile',
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="[--header-height:calc(--spacing(12))]">
      <Outlet />
    </div>
  );
}
