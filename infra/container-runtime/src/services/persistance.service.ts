import { spawn } from 'child_process';
import process from 'process';

import { ROOT_DIR } from '../lib/constants';

export class PersistanceService {
  private static instance: PersistanceService;
  private readonly s3Path: string = `:s3:${process.env.S3_BUCKET}/${process.env.FILE_SYSTEM_PATH}`;
  private readonly localPath: string = ROOT_DIR;

  constructor() {}

  static getInstance(): PersistanceService {
    if (!this.instance) {
      this.instance = new PersistanceService();
    }
    return this.instance;
  }

  private runCommand(args: string[]): Promise<void> {
    const fullArgs = [...args, '--transfers', '8', '--fast-list', '--exclude', 'node_modules/**'];

    return new Promise((resolve, reject) => {
      const proc = spawn('rclone', fullArgs, {
        env: process.env,
      });

      const stderr: string[] = [];

      proc.stderr.on('data', (chunk: Buffer) => {
        const line = chunk.toString().trim();
        stderr.push(line);
        console.log(line);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`rclone exited with code ${code}:\n${stderr.join('\n')}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn rclone: ${err.message}`));
      });
    });
  }

  private async pathExists(): Promise<boolean> {
    console.log('Checking if path exists...');
    return new Promise((resolve) => {
      const proc = spawn('rclone', ['ls', this.s3Path], { env: process.env });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }

  async restore(onNotFound?: () => Promise<void>): Promise<void> {
    console.log('Restoring files....');
    const exists = await this.pathExists();
    if (!exists) {
      console.log('Path does not exist, skipping restore.');
      if (onNotFound) await onNotFound();
      return;
    }
    await this.runCommand(['copy', this.s3Path, this.localPath]);
  }

  async sync() {
    await this.runCommand(['sync', this.localPath, this.s3Path]);
  }
}
