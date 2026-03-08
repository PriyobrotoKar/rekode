import { ProfileForm } from '@/features/auth/components/profile-form';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/profile/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ProfileForm />;
}
