import { Project, ProjectVisibility } from '@rekode/types/client/proto/project';
import { IconCode, IconLock, IconWorld } from '@tabler/icons-react';
import { formatDistanceToNowStrict } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-card flex w-full flex-col items-start gap-4 overflow-hidden rounded-sm border p-4 text-left transition-colors hover:border-white/30"
    >
      <div>
        <IconCode />
      </div>
      <div className="flex w-full flex-col gap-2">
        <span className="font-medium">{project.slug}</span>
        <div className="text-muted-foreground flex w-full items-center justify-between text-sm">
          <VisibilityStatus visibility={project.visibility} />
          <div>{formatDistanceToNowStrict(new Date(project.createdAt), { addSuffix: true })}</div>
        </div>
      </div>
    </button>
  );
}

interface VisibilityStatusProps {
  visibility: ProjectVisibility;
}

function VisibilityStatus({ visibility }: VisibilityStatusProps) {
  switch (visibility) {
    case ProjectVisibility.PROJECT_VISIBILITY_PUBLIC:
      return (
        <span className="text-muted-foreground flex items-center gap-1 text-sm">
          <IconWorld className="size-4" /> Public
        </span>
      );
    case ProjectVisibility.PROJECT_VISIBILITY_PRIVATE:
      return (
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          <IconLock className="size-4" /> Private
        </span>
      );
  }
}
