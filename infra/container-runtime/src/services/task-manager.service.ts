import { spawn } from 'node:child_process';
import path from 'node:path';

import { ROOT_DIR, WsNamespace } from '../lib/constants';
import { sleep } from '../lib/utils';
import { GitService } from './git.service';

enum TaskId {
  CLONE_REPO = 'clone_repo',
  INSTALL_DEPS = 'install_deps',
  START_PREVIEW = 'start_preview',
}

enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

interface TaskEvent {
  namespace: WsNamespace;
  payload: any;
}

type Subscriber = (event: TaskEvent) => void;

interface TaskManagerConfig {
  gitRepoUrl: string;
  installDepsCommand: string;
  rootDir: string;
}

interface TaskState {
  id: TaskId;
  status: TaskStatus;
}

interface Snapshot {
  status: TaskStatus;
  tasks: Record<TaskId, TaskState>;
}

export class TaskManagerService {
  private readonly gitService: GitService;
  private static instance?: TaskManagerService;
  private subscribers: Set<Subscriber>;
  snapshot: Snapshot;

  private constructor() {
    this.gitService = GitService.getInstance();
    this.snapshot = this.createInitialSnapshot();
    this.subscribers = new Set<Subscriber>();
  }

  static getInstance() {
    if (!TaskManagerService.instance) TaskManagerService.instance = new TaskManagerService();
    return TaskManagerService.instance;
  }

  private createInitialSnapshot(): Snapshot {
    const tasks = Object.values(TaskId).reduce(
      (acc, id) => {
        acc[id] = {
          id,
          status: TaskStatus.PENDING,
        };
        return acc;
      },
      {} as Record<TaskId, TaskState>,
    );

    return {
      status: TaskStatus.PENDING,
      tasks,
    };
  }

  subscribe(subscriber: Subscriber) {
    this.subscribers.add(subscriber);

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private emit(namespace: WsNamespace, payload: any) {
    for (const listener of this.subscribers) {
      listener({ namespace, payload });
    }
  }

  private updateTaskStatus(taskId: TaskId, status: TaskStatus) {
    const task = this.snapshot.tasks[taskId];
    task.status = status;

    this.emit(WsNamespace.TASK_STATE_UPDATED, { taskId, task });
  }

  setupContainer(config: TaskManagerConfig) {
    return this.runSetupPipeline(config);
  }

  private async runSetupPipeline(config: TaskManagerConfig) {
    try {
      this.snapshot.status = TaskStatus.RUNNING;
      this.emit(WsNamespace.TASK_STATE_UPDATED, { status: TaskStatus.RUNNING });

      await sleep(2000);

      this.updateTaskStatus(TaskId.CLONE_REPO, TaskStatus.RUNNING);
      await this.gitService.cloneRepo(config.gitRepoUrl);
      this.updateTaskStatus(TaskId.CLONE_REPO, TaskStatus.COMPLETED);

      this.updateTaskStatus(TaskId.INSTALL_DEPS, TaskStatus.RUNNING);
      await this.runCommand(config.installDepsCommand, config.rootDir);
      this.updateTaskStatus(TaskId.INSTALL_DEPS, TaskStatus.COMPLETED);

      this.snapshot.status = TaskStatus.COMPLETED;
      this.emit(WsNamespace.TASK_STATE_UPDATED, {
        status: TaskStatus.COMPLETED,
      });
    } catch (error) {
      console.error('Container setup pipeline failed:', error);

      if (this.snapshot.tasks[TaskId.CLONE_REPO].status === TaskStatus.RUNNING) {
        this.updateTaskStatus(TaskId.CLONE_REPO, TaskStatus.FAILED);
      }

      if (this.snapshot.tasks[TaskId.INSTALL_DEPS].status === TaskStatus.RUNNING) {
        this.updateTaskStatus(TaskId.INSTALL_DEPS, TaskStatus.FAILED);
      }

      throw error;
    }
  }

  private async runCommand(command: string, cwd: string) {
    const [cmd, ...args] = command.split(' ');

    if (!cmd) return;

    const resolvedCwd = path.resolve(process.cwd(), cwd);

    const runner = spawn(cmd, args, {
      cwd: resolvedCwd,
      shell: false,
    });

    return new Promise<void>((resolve, reject) => {
      let stderr = '';

      runner.stdout.on('data', (data: Buffer) => {
        process.stdout.write(data.toString());
      });

      runner.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });

      runner.on('error', (error) => {
        reject(new Error(`Failed to spawn \"${command}\" in ${resolvedCwd}: ${error.message}`));
      });

      runner.on('exit', (code) => {
        if (code === 0) resolve();
        else {
          const details = stderr.trim();
          const message = details
            ? `Command \"${command}\" failed with code ${code} in ${resolvedCwd}\n${details}`
            : `Command \"${command}\" failed with code ${code} in ${resolvedCwd}`;
          reject(new Error(message));
        }
      });
    });
  }
}
