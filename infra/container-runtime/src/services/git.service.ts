import { exec } from 'child_process';

import { ROOT_DIR } from '../lib/constants';

export class GitService {
  private static instance?: GitService;
  private readonly workingDir: string;
  private isCloned: boolean = false;

  private constructor(workingDir: string = ROOT_DIR) {
    this.workingDir = workingDir;
  }

  static getInstance(workingDir: string = ROOT_DIR) {
    if (!GitService.instance) {
      GitService.instance = new GitService(workingDir);
    }

    return GitService.instance;
  }

  async cloneRepo(url: string) {
    console.log(`Cloning repository from ${url}`);
    await this.execCommand(`git clone ${url} .`);
    console.log('Repository cloned successfully');
    this.isCloned = true;
  }

  async getStatus() {
    const statusMap = {
      '??': 'untracked',
      '!!': 'ignored',
      A: 'added',
      M: 'modified',
      D: 'deleted',
      R: 'renamed',
    };

    const output = await this.execCommand('git status --porcelain --ignored');

    const fileStatuses = output
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const status = line.slice(0, 2).trim();
        const file = line.slice(3);
        return {
          status: statusMap[status as keyof typeof statusMap],
          path: file,
        };
      });

    return fileStatuses;
  }

  private execCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.workingDir }, (error, stdout, stderr) => {
        if (error) {
          const message = stderr?.trim() || error.message;
          reject(new Error(message));
          return;
        }

        resolve(stdout);
      });
    });
  }
}
