import { EmptyProjects } from '@/features/projects/components/empty-projects';
import { Header } from '@/features/shared/components/header';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/')({ component: DashboardPage });

function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <EmptyProjects />
      </div>
    </main>
  );
}
