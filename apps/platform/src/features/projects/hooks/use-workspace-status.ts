import { useEffect, useState } from 'react';

import { useAtom } from 'jotai';

import { installLogsAtom, type WorkspaceTasks, workspaceTasksAtom } from '../lib/atoms';
import { useSocket } from '../providers/socket-provider';

export type LoaderStepId = 'create_workspace' | keyof WorkspaceTasks;

interface UseWorkspaceStatusResult {
  workspaceTasks: WorkspaceTasks;
  activeStepId: LoaderStepId;
  isWorkspaceReady: boolean;
  installLogs: string;
}

const TASK_STATE_UPDATED_EVENT = 'task.state.updated';
const TASK_STATE_REQUESTED_EVENT = 'task.state.requested';
const TASK_LOG_EVENT = 'task.log';

const getActiveStepId = (
  taskId: string | undefined,
  status: WorkspaceTasks,
  taskState: string | undefined,
): LoaderStepId | null => {
  if (taskId === 'clone_repo' && taskState === 'completed') {
    return status.install_deps.status === 'completed' ? null : 'install_deps';
  }

  if (taskId === 'install_deps' && taskState === 'completed') {
    return null;
  }

  if (taskId === 'clone_repo' || taskId === 'install_deps') {
    return taskId;
  }

  if (status.clone_repo.status !== 'completed' && status.install_deps.status !== 'failed') {
    return 'create_workspace';
  }

  if (status.install_deps.status !== 'completed' && status.install_deps.status !== 'failed') {
    return 'install_deps';
  }

  return null;
};

export function useWorkspaceStatus(): UseWorkspaceStatusResult {
  const { subscribe, send, isReady } = useSocket();
  const [workspaceTasks, setWorkspaceTasks] = useAtom(workspaceTasksAtom);
  const [installLogs, setInstallLogs] = useAtom(installLogsAtom);
  const [activeStepId, setActiveStepId] = useState<LoaderStepId>('create_workspace');

  const isWorkspaceReady = Object.values(workspaceTasks).every(
    ({ status }) => status === 'completed' || status === 'failed',
  );

  useEffect(() => {
    if (!isReady) return;
    send(TASK_STATE_REQUESTED_EVENT, {});

    const unsubscribe = subscribe(TASK_STATE_UPDATED_EVENT, (payload) => {
      const taskId: string | undefined = payload.taskId ?? undefined;

      setWorkspaceTasks((prev) => {
        let nextTasks: WorkspaceTasks = { ...prev };

        if (payload.tasks) {
          const filteredTasks = Object.fromEntries(
            Object.entries(payload.tasks).filter(([key]) => key in workspaceTasks),
          );

          nextTasks = filteredTasks;
        } else if (payload.taskId) {
          nextTasks[payload.taskId] = payload.task;
        }

        const nextActiveStep =
          Object.keys(nextTasks).find((taskId) => nextTasks[taskId].status === 'running') ??
          'create_workspace';

        if (nextActiveStep) {
          setActiveStepId(nextActiveStep);
        }

        return nextTasks;
      });
    });

    const unsubscribeLogs = subscribe(TASK_LOG_EVENT, (payload) => {
      if (payload?.taskId !== 'install_deps' || typeof payload.chunk !== 'string') return;
      setInstallLogs((prev) => prev + payload.chunk);
    });

    return () => {
      unsubscribe();
      unsubscribeLogs();
    };
  }, [subscribe, isReady, send, setWorkspaceTasks, setInstallLogs]);

  return { workspaceTasks, activeStepId, isWorkspaceReady, installLogs };
}
