export enum WsNamespace {
  TASK_STATE_REQUESTED = 'task.state.requested',
  TASK_STATE_UPDATED = 'task.state.updated',

  TERMINAL_OUTPUT = 'terminal.output',
  TERMINAL_INPUT = 'terminal.input',
  TERMINAL_RESIZE = 'terminal.resize',

  DIRS_WATCHED = 'dirs.watched',
  DIR_REQUESTED = 'dir.requested',

  FILES_LOADED = 'files.loaded',
  FILES_ADDED = 'files.added',
  FILE_REQUESTED = 'file.requested',
  FILE_CREATED = 'file.created',
  FILE_READ = 'file.read',
  FILE_WRITE = 'file.write',

  GIT_STATUS_UPDATED = 'git.status.updated',
}

export const ROOT_DIR = '../workspace';

export const WATCHER_IGNORED_PATHS = ['.git'];
