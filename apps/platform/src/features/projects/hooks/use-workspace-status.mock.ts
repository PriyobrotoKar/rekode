import { useEffect, useState } from 'react';

import { useAtom } from 'jotai';

import { type WorkspaceTasks, workspaceTasksAtom } from '../lib/atoms';
import type { LoaderStepId } from './use-workspace-status';

interface UseWorkspaceStatusResult {
  workspaceTasks: WorkspaceTasks;
  activeStepId: LoaderStepId;
  isWorkspaceReady: boolean;
}

interface MockOptions {
  delay?: number;
}

export function useWorkspaceStatusMock(options?: MockOptions): UseWorkspaceStatusResult {
  const delay = options?.delay ?? 2000;
  const [workspaceTasks, setWorkspaceTasks] = useAtom(workspaceTasksAtom);
  const [activeStepId, setActiveStepId] = useState<LoaderStepId>('create_workspace');

  const isWorkspaceReady = Object.values(workspaceTasks).every(
    ({ status }) => status === 'completed' || status === 'failed',
  );

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        setWorkspaceTasks((prev) => ({
          ...prev,
          clone_repo: {
            status: 'running',
            startTime: Date.now(),
          },
        }));
        setActiveStepId('clone_repo');
      }, delay),
    );

    timers.push(
      setTimeout(() => {
        setWorkspaceTasks((prev) => ({
          ...prev,
          clone_repo: {
            status: 'completed',
            endTime: Date.now(),
          },
          install_deps: {
            status: 'running',
            startTime: Date.now(),
          },
        }));
        setActiveStepId('install_deps');
      }, delay * 2),
    );

    return () => timers.forEach(clearTimeout);
  }, [delay, setWorkspaceTasks]);

  return { workspaceTasks, activeStepId, isWorkspaceReady };
}
