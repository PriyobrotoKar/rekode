import { ConfigureProjectDialog } from '@/features/projects/components/configure-project-dialog';
import { CreateProjectDialog } from '@/features/projects/components/create-project-dialog';
import { EmptyProjects } from '@/features/projects/components/empty-projects';
import { ProjectCard } from '@/features/projects/components/project-card';
import {
  getAllProjectsQueryOptions,
  startProjectMutationOptions,
} from '@/features/projects/queries';
import { Header } from '@/features/shared/components/header';
import { IconBrandGithub, IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { Button } from '@rekode/ui/components/button';
import { Skeleton } from '@rekode/ui/components/skeleton';

export const Route = createFileRoute('/_protected/')({ component: DashboardPage });

function DashboardPage() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useQuery(getAllProjectsQueryOptions);
  const { mutate: startProject } = useMutation({
    ...startProjectMutationOptions,
    onSuccess: (_, slug) => navigate({ to: '/project/$slug', params: { slug } }),
  });

  const hasProjects = projects && projects.length > 0;

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      {isLoading ? (
        <div className="space-y-6 px-4 py-4">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-24 rounded-md" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card flex flex-col gap-4 rounded-sm border p-4">
                <Skeleton className="size-6 rounded-md" />
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : hasProjects ? (
        <div className="space-y-6 px-4 py-4">
          <div className="flex justify-between">
            <h2 className="text-2xl">Recents</h2>
            <div className="space-x-2">
              <Button variant="secondary" size="sm">
                <IconBrandGithub data-icon="inline-start" />
                Import
              </Button>
              <CreateProjectDialog
                trigger={
                  <Button variant="default" size="sm">
                    <IconPlus data-icon="inline-start" />
                    Create
                  </Button>
                }
              />
              <ConfigureProjectDialog />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => startProject(project.slug)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <EmptyProjects />
        </div>
      )}
    </main>
  );
}
