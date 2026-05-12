import { atom } from 'jotai';

interface EditorTab {
  path: string;
  hasUnsavedChanges: boolean;
}

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface WorkspaceTaskStatus {
  clone_repo: TaskStatus;
  install_deps: TaskStatus;
}

export const workspaceTaskStatus = atom<WorkspaceTaskStatus>({
  clone_repo: 'pending',
  install_deps: 'pending',
});

export const templateAtom = atom<string | 'blank' | null>(null);
export const configureProjectDialogOpenAtom = atom<boolean>(false);
export const editorTabsAtom = atom<EditorTab[]>([]);
export const currentPathAtom = atom<string>('');
