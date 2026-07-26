import { PING_INTERVAL } from '../lib/constants';

export class ContainerService {
  private readonly pingIntervalMs = PING_INTERVAL * 1000;
  private pingTimeout: NodeJS.Timeout | undefined;

  constructor(private readonly cleanupFn?: () => Promise<void>) {}

  ping() {
    clearTimeout(this.pingTimeout);

    this.pingTimeout = setTimeout(() => {
      this.kill();
    }, this.pingIntervalMs);
  }

  private async kill() {
    console.log(`No ping received for last ${this.pingIntervalMs / 1000} seconds`);

    console.log('Executing cleanup function...');
    await this.cleanupFn?.();

    console.log('Killing container...');
    process.exit(0);
  }
}
