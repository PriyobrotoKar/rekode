import { useEffect, useState } from 'react';

import { IconCheck, IconLoader2 } from '@tabler/icons-react';
import { useAtom } from 'jotai';

import { cn } from '@rekode/ui/lib/utils';

import { type WorkspaceTaskStatus, workspaceTaskStatus } from '../lib/atoms';
import { useSocket } from '../providers/socket-provider';

const TASK_STATE_UPDATED_EVENT = 'task.state.updated';
const TASK_STATE_REQUESTED_EVENT = 'task.state.requested';

type LoaderStepId = 'create_workspace' | 'clone_repo' | 'install_deps';

const LOADER_STEPS: Array<{ id: LoaderStepId; label: string }> = [
  { id: 'create_workspace', label: 'Creating Workspace' },
  { id: 'clone_repo', label: 'Cloning Repository' },
  { id: 'install_deps', label: 'Installing Dependencies' },
];

const STEP_HEIGHT = 30;

const getActiveStepId = (
  taskId: string | undefined,
  status: WorkspaceTaskStatus,
  taskState: string | undefined,
): LoaderStepId | null => {
  if (taskId === 'clone_repo' && taskState === 'completed') {
    return status.install_deps === 'completed' ? null : 'install_deps';
  }

  if (taskId === 'install_deps' && taskState === 'completed') {
    return null;
  }

  if (taskId === 'clone_repo' || taskId === 'install_deps') {
    return taskId;
  }

  if (status.clone_repo !== 'completed' && status.install_deps !== 'failed') {
    return 'create_workspace';
  }

  if (status.install_deps !== 'completed' && status.install_deps !== 'failed') {
    return 'install_deps';
  }

  return null;
};

export function WorkspaceLoader() {
  const { subscribe, send, isReady } = useSocket();
  const [workspaceStatus, setWorkspaceStatus] = useAtom(workspaceTaskStatus);
  const [activeStepId, setActiveStepId] = useState<LoaderStepId>('create_workspace');

  const isWorkspaceReady = Object.values(workspaceStatus).every(
    (status) => status === 'completed' || status === 'failed',
  );

  const activeStepIndex = Math.max(
    LOADER_STEPS.findIndex((step) => step.id === activeStepId),
    0,
  );

  const offset = STEP_HEIGHT - activeStepIndex * STEP_HEIGHT;

  useEffect(() => {
    if (!isReady) return;
    send(TASK_STATE_REQUESTED_EVENT, {});

    const unsubscribeTaskManagerStateUpdate = subscribe(TASK_STATE_UPDATED_EVENT, (payload) => {
      const taskId: string | undefined = payload.taskId ?? undefined;

      setWorkspaceStatus((prev) => {
        const nextStatus: WorkspaceTaskStatus = { ...prev };

        if (payload.tasks) {
          const cloneTask = payload.tasks.clone_repo;
          const installTask = payload.tasks.install_deps;

          if (cloneTask) nextStatus.clone_repo = cloneTask.status;
          if (installTask) nextStatus.install_deps = installTask.status;
        }

        if (taskId === 'clone_repo' || taskId === 'install_deps') {
          nextStatus[taskId] = payload.task?.status ?? 'pending';
        }

        const nextActiveStep = getActiveStepId(taskId, nextStatus, payload.task?.status);
        if (nextActiveStep) {
          setActiveStepId(nextActiveStep);
        }

        return nextStatus;
      });
    });

    return () => {
      unsubscribeTaskManagerStateUpdate();
    };
  }, [subscribe, isReady, send, setWorkspaceStatus]);

  if (isWorkspaceReady) return null;

  return (
    <div className="bg-background flex flex-1 items-center justify-center">
      <div className="relative flex items-center gap-3">
        <div className="absolute flex h-full w-5 items-center justify-center">
          <IconLoader2 className="text-foreground/90 size-4 animate-spin" stroke={1.8} />
        </div>

        <div className="h-[90px] overflow-hidden">
          <div
            className="ease-out-cubic flex flex-col transition-transform duration-500"
            style={{ transform: `translateY(${offset}px)` }}
          >
            {LOADER_STEPS.map((step, index) => {
              const isCompleted = index < activeStepIndex;
              const isActive = index === activeStepIndex;

              return (
                <div key={step.id} className="flex h-[30px] items-center gap-2 pl-1 text-sm">
                  <span className="flex w-3.5 items-center justify-center">
                    {isCompleted ? (
                      <IconCheck
                        className="animate-in text-secondary fade-in size-3 duration-300"
                        stroke={2.2}
                      />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      'text-muted-foreground origin-left scale-90 transition-all duration-500',
                      isActive && 'text-foreground scale-100 font-medium',
                      isCompleted && 'text-secondary',
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
