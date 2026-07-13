import { useEffect, useState } from 'react';

import { IconDeviceDesktop, IconKeyboard, IconTerminal2 } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useLoaderData, useParams } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';

import { Button } from '@rekode/ui/components/button';
import { Kbd, KbdGroup } from '@rekode/ui/components/kbd';
import { Logo } from '@rekode/ui/components/logo';

import { maximizePreviewAtom, showPreviewAtom, showTerminalAtom, workspaceTasksAtom } from '../lib/atoms';
import { getAllTemplatesQueryOptions, getProjectBySlugQueryOptions } from '../queries';

export function WelcomeScreen() {
  const workspaceStatus = useAtomValue(workspaceTasksAtom);
  const maximizePreview = useAtomValue(maximizePreviewAtom);

  const isWorkspaceReady = Object.values(workspaceStatus).every(
    ({ status }) => status === 'completed' || status === 'failed',
  );

  const { slug } = useParams({
    from: '/_protected/project/$slug/',
  });

  const { data } = useQuery({
    ...getProjectBySlugQueryOptions(slug),
  });
  const { data: templates } = useQuery(getAllTemplatesQueryOptions);
  const template = templates?.find((t) => t.id === data?.templateId);

  console.log(data, isWorkspaceReady);

  if (!data || !template || !isWorkspaceReady || maximizePreview) return null;

  return (
    <div className="mx-auto flex w-full flex-1 items-center justify-center px-4">
      <main className="w-full max-w-lg space-y-9">
        <Logo className="gap-4 opacity-20" iconClassName="size-16" textClassName="text-4xl" />
        <div className="space-y-6">
          <QuickActions />
          <ProjectDetails data={data} template={template} />
        </div>
        <RunningTimer updatedAt={data.updatedAt} />
      </main>
    </div>
  );
}

function QuickActions() {
  const setShowPreview = useSetAtom(showPreviewAtom);
  const setTerminalOpen = useSetAtom(showTerminalAtom);

  return (
    <div className="flex w-full gap-2 *:flex-1">
      <Button variant={'secondary'} size={'xl'} onClick={() => setShowPreview((prev) => !prev)}>
        <div className="flex w-full items-center justify-between">
          <IconDeviceDesktop />
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
        </div>
        Toggle Preview
      </Button>
      <Button variant={'secondary'} size={'xl'} onClick={() => setTerminalOpen((prev) => !prev)}>
        <div className="flex w-full items-center justify-between">
          <IconTerminal2 />
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>J</Kbd>
          </KbdGroup>
        </div>
        Open Terminal
      </Button>
      <Button variant={'secondary'} size={'xl'}>
        <div className="flex w-full items-center justify-between">
          <IconKeyboard />
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>/</Kbd>
          </KbdGroup>
        </div>
        Show Shortcuts
      </Button>
    </div>
  );
}

function RunningTimer({ updatedAt }: { updatedAt: string }) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateRunningTime = (updatedAt: string): number => {
    const date = new Date(updatedAt);
    return (Date.now() - date.getTime()) / 1000;
  };

  const [runningTime, setRunningTime] = useState<number | null>(() =>
    calculateRunningTime(updatedAt),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRunningTime(calculateRunningTime(updatedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="relative size-2 rounded-full bg-green-600 before:absolute before:inset-0 before:size-2 before:animate-ping before:rounded-full before:bg-green-600" />
      <p className="text-muted-foreground">
        Running since <span className="text-foreground">{formatTime(runningTime ?? 0)}</span>
      </p>
    </div>
  );
}

function ProjectDetails({
  data,
  template,
}: {
  data: NonNullable<ReturnType<typeof useLoaderData>>;
  template: NonNullable<ReturnType<typeof useLoaderData>>;
}) {
  return (
    <div className="text-md space-y-1">
      <div className="flex gap-2">
        <div className="text-muted-foreground flex-[0.5_1_0%]">Project</div>{' '}
        <div className="flex-1">{data.slug}</div>
      </div>

      <div className="flex gap-2">
        <div className="text-muted-foreground flex-[0.5_1_0%]">Template</div>{' '}
        <div className="flex-1">{template.slug}</div>
      </div>

      <div className="flex gap-2">
        <div className="text-muted-foreground flex-[0.5_1_0%]">Language</div>{' '}
        <div className="flex-1">{template.language}</div>
      </div>
    </div>
  );
}
