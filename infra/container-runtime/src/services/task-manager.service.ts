import { ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';

import { ROOT_DIR, WsNamespace } from '../lib/constants';
import { sleep } from '../lib/utils';
import { GitService } from './git.service';

enum TaskId {
  CLONE_REPO = 'clone_repo',
  INSTALL_DEPS = 'install_deps',
  START_DEVELOPMENT_SERVER = 'start_development_server',
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
  buildCommand: string;
  startDevServerCommand: string;
  rootDir: string;
}

interface TaskState {
  id: TaskId;
  status: TaskStatus;
  startTime?: number;
  endTime?: number;
}

interface Snapshot {
  status: TaskStatus;
  tasks: Record<TaskId, TaskState>;
}

export class TaskManagerService {
  private readonly gitService: GitService;
  private static instance?: TaskManagerService;
  private subscribers: Set<Subscriber>;
  private readonly services: Map<string, ChildProcess>;
  private static readonly INSTALL_LOG_LIMIT = 500;
  private installLogs: string[] = [];
  snapshot: Snapshot;

  private constructor() {
    this.gitService = GitService.getInstance();
    this.snapshot = this.createInitialSnapshot();
    this.subscribers = new Set<Subscriber>();
    this.services = new Map<string, ChildProcess>();
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

  getInstallLogs(): string[] {
    return this.installLogs;
  }

  private appendInstallLog(chunk: string, stream: 'stdout' | 'stderr') {
    this.installLogs.push(chunk);

    if (this.installLogs.length > TaskManagerService.INSTALL_LOG_LIMIT) {
      this.installLogs.splice(0, this.installLogs.length - TaskManagerService.INSTALL_LOG_LIMIT);
    }

    this.emit(WsNamespace.TASK_LOG, { taskId: TaskId.INSTALL_DEPS, chunk, stream });
  }

  private updateTaskStatus(taskId: TaskId, status: TaskStatus) {
    const task = this.snapshot.tasks[taskId];
    task.status = status;

    if (status === TaskStatus.RUNNING) task.startTime = Date.now();
    if (status === TaskStatus.COMPLETED) task.endTime = Date.now();

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
      await this.runInstallWithSyntheticLogs(config);
      this.updateTaskStatus(TaskId.INSTALL_DEPS, TaskStatus.COMPLETED);

      this.updateTaskStatus(TaskId.START_DEVELOPMENT_SERVER, TaskStatus.RUNNING);
      // await this.runCommand(config.buildCommand, config.rootDir);
      await this.startService(
        'dev_server' + '_' + config.startDevServerCommand.split(' ').join('_'),
        config.startDevServerCommand,
        config.rootDir,
      );
      this.updateTaskStatus(TaskId.START_DEVELOPMENT_SERVER, TaskStatus.COMPLETED);

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

  private async runInstallWithSyntheticLogs(config: TaskManagerConfig) {
    this.appendInstallLog(`$ ${config.installDepsCommand}\n`, 'stdout');
    this.appendInstallLog('Installing dependencies...\n', 'stdout');

    await this.runCommand(config.installDepsCommand, config.rootDir, TaskId.INSTALL_DEPS);

    this.appendInstallLog('Dependencies installed successfully.\n', 'stdout');
  }

  private async startService(id: string, command: string, cwd: string, readyRegex?: RegExp) {
    const [cmd, ...args] = command.split(' ');

    if (!cmd) return;

    const resolvedCwd = path.resolve(process.cwd(), cwd);

    const child = spawn(cmd, args, {
      cwd: resolvedCwd,
      shell: false,
      env: process.env,
    });

    this.services.set(id, child);

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      const finish = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();

        process.stdout.write(text);

        // send logs to websocket if you want
        // this.emit(WsNamespace.TERMINAL_OUTPUT, text);

        if (readyRegex) {
          if (readyRegex.test(text)) {
            finish();
          }
        } else {
          // If no ready regex was provided, resolve immediately
          finish();
        }
      });

      child.stderr.on('data', (data: Buffer) => {
        process.stderr.write(data);

        // this.emit(WsNamespace.TERMINAL_OUTPUT, data.toString());
      });

      child.on('error', reject);

      child.on('exit', (code) => {
        this.services.delete(id);

        if (!resolved) {
          reject(new Error(`Service "${id}" exited before becoming ready (code ${code})`));
        } else {
          console.log(`Service "${id}" exited (${code})`);
        }
      });
    });
  }

  private async runCommand(command: string, cwd: string, taskId?: TaskId) {
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
        const text = data.toString();
        process.stdout.write(text);

        if (taskId === TaskId.INSTALL_DEPS) this.appendInstallLog(text, 'stdout');
      });

      runner.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);

        if (taskId === TaskId.INSTALL_DEPS) this.appendInstallLog(text, 'stderr');
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
