import { ProfileForm } from '@/features/auth/components/profile-form';
import { UserController } from '@/features/user/api';
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/profile/')({
  loader: async () => {
    const { user } = await UserController.getSelf();
    if (!user) throw notFound();
    return { user };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useLoaderData();
  return <ProfileForm user={user} />;
}
