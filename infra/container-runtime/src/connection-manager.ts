import { WebSocket } from 'ws';

import { ROOT_DIR, WsNamespace } from './lib/constants';
import { FileManager } from './services/file-manager.service';
import { GitService } from './services/git.service';
import { TaskManagerService } from './services/task-manager.service';
import { TerminalSession } from './services/terminal.service';
import { WatcherService } from './services/watcher.service';

export function handleConnection(ws: WebSocket) {
  const taskManager = TaskManagerService.getInstance();
  const terminal = new TerminalSession();
  const git = GitService.getInstance();
  const fileManager = new FileManager();
  const globalWatcher = WatcherService.getInstance(ROOT_DIR);
  const selectiveWatcher = WatcherService.getInstanceOptimized(ROOT_DIR);

  if (taskManager.snapshot.tasks.clone_repo.status !== 'completed') {
    globalWatcher.pause();
  }

  function sendEvent(namespace: WsNamespace, payload: unknown) {
    if (ws.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        namespace,
        payload,
      }),
    );
  }

  async function refreshGitStatus() {
    try {
      const status = await git.getStatus();
      sendEvent(WsNamespace.GIT_STATUS_UPDATED, status);
    } catch (error) {
      console.error(error);
    }
  }

  refreshGitStatus();

  function replayInstallLogs() {
    for (const chunk of taskManager.getInstallLogs()) {
      sendEvent(WsNamespace.TASK_LOG, { taskId: 'install_deps', chunk, stream: 'stdout' });
    }
  }

  replayInstallLogs();

  const unsubscribeTaskManager = taskManager.subscribe((event) => {
    console.log(`Task state updated: ${event.namespace}, ${event.payload}`);
    const task = event.payload?.task;

    if (task?.id === 'clone_repo' && task.status === 'completed') {
      void Promise.all([globalWatcher.loadGitignore(), selectiveWatcher.loadGitignore()]).then(
        () => globalWatcher.resume(),
      );
    }

    sendEvent(event.namespace, event.payload);
  });

  const unsubscribeSelectiveWatcher = selectiveWatcher.subscribe({
    onAdd: async (paths: string[]) => {
      console.log(`Files added: ${paths}`);
      sendEvent(WsNamespace.FILES_LOADED, paths);
    },
    onAddDir: async (paths: string[]) => {
      const dirs = paths.map((p) => `${p}/`);
      console.log(`Dirs added: ${dirs}`);
      sendEvent(WsNamespace.FILES_LOADED, dirs);
      await refreshGitStatus();
    },
  });

  const unsubscribeGlobalWatcher = globalWatcher.subscribe({
    onAdd: async () => {
      await refreshGitStatus();
    },
    onChange: async () => {
      await refreshGitStatus();
    },
    onDelete: async () => {
      await refreshGitStatus();
    },
    onAddDir: async () => {
      await refreshGitStatus();
    },
  });

  terminal.onData((data) => {
    sendEvent(WsNamespace.TERMINAL_OUTPUT, data);
  });

  ws.on('message', async (msg) => {
    const parsed = JSON.parse(msg.toString());

    switch (parsed.namespace) {
      case WsNamespace.TASK_STATE_REQUESTED:
        const taskState = taskManager.snapshot;
        sendEvent(WsNamespace.TASK_STATE_UPDATED, taskState);
        break;

      case WsNamespace.TERMINAL_INPUT:
        terminal.write(parsed.payload);
        break;

      case WsNamespace.TERMINAL_RESIZE:
        terminal.resize(parsed.payload.cols, parsed.payload.rows);
        break;

      case WsNamespace.DIR_REQUESTED:
        const dir = parsed.payload.path;
        const files = await fileManager.getAllFiles(dir);
        sendEvent(WsNamespace.FILES_LOADED, files);
        break;

      case WsNamespace.DIRS_WATCHED:
        selectiveWatcher.setWatchingDirs(parsed.payload.paths);
        break;

      case WsNamespace.FILE_REQUESTED:
        const file = await fileManager.getFile(parsed.payload.path);
        sendEvent(WsNamespace.FILE_READ, file);
        break;

      case WsNamespace.FILE_WRITE: {
        await fileManager.writeFile(parsed.payload.path, parsed.payload.content);
        break;
      }
    }
  });

  ws.on('close', () => {
    terminal.dispose();
    unsubscribeGlobalWatcher();
    unsubscribeSelectiveWatcher();
    unsubscribeTaskManager();
  });
}
