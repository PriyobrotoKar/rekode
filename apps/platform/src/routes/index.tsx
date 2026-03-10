import { EmptyProjects } from '@/features/projects/components/empty-projects';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: DashboardPage });

function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <EmptyProjects />
    </main>
  );
}
