import { atom } from 'jotai';

export interface EditorTab {
  path: string;
  hasUnsavedChanges: boolean;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
type WorkspaceTaskState = {
  status: TaskStatus;
  startTime?: number;
  endTime?: number;
};

export interface WorkspaceTasks {
  clone_repo: WorkspaceTaskState;
  install_deps: WorkspaceTaskState;
  start_development_server: WorkspaceTaskState;
}

export const workspaceTasksAtom = atom<WorkspaceTasks>({
  clone_repo: { status: 'pending' },
  install_deps: { status: 'pending' },
  start_development_server: { status: 'pending' },
});

export const installLogsAtom = atom<string>('');

export const templateAtom = atom<string | 'blank' | null>(null);
export const configureProjectDialogOpenAtom = atom<boolean>(false);
export const editorTabsAtom = atom<EditorTab[]>([]);
export const currentPathAtom = atom<string>('');
export const pathStackAtom = atom<string[]>([]);
export const lastClosedTabPathAtom = atom<string | null>(null);
export const maximizePreviewAtom = atom<boolean>(false);
export const showPreviewAtom = atom<boolean>(false);
export const showTerminalAtom = atom<boolean>(false);
