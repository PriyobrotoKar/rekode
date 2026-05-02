import { IconBrandGithub, IconLayoutGridAdd } from '@tabler/icons-react';

import { Button } from '@rekode/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@rekode/ui/components/empty';

import { ConfigureProjectDialog } from './configure-project-dialog';
import { CreateProjectDialog } from './create-project-dialog';

export function EmptyProjects() {
  return (
    <Empty className="gap-7 border-0 p-0">
      <EmptyHeader>
        <EmptyMedia variant={'icon'}>
          <IconLayoutGridAdd />
        </EmptyMedia>
        <div className="space-y-2">
          <EmptyTitle className="font-heading text-foreground text-3xl">No Projects Yet</EmptyTitle>
          <EmptyDescription className="text-md text-muted-foreground text-center">
            You don&apos;t have any projects. You can start a new project by choosing a template or
            importing a GitHub repository.
          </EmptyDescription>
        </div>
      </EmptyHeader>
      <EmptyContent className="flex flex-row items-center gap-3">
        <Button variant="secondary" size="sm">
          <IconBrandGithub data-icon="inline-start" />
          Import from GitHub
        </Button>
        <CreateProjectDialog />
        <ConfigureProjectDialog />
      </EmptyContent>
    </Empty>
  );
}
