import { exec } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface PortInfo {
  port: number;
  pid?: number;
  process?: string;
}

export class PortWatcher extends EventEmitter {
  private previousPorts = new Map<number, PortInfo>();
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly pollIntervalMs = 1000,
    private readonly ignoredPorts = new Set<number>([
      22, // SSH
      41613, // Docker internal net
      2375, // Docker
      2376, // Docker TLS
      9999, // WS
    ]),
  ) {
    super();
  }

  start() {
    if (this.interval) {
      return;
    }

    this.interval = setInterval(async () => {
      try {
        await this.poll();
      } catch (err) {
        this.emit('error', err);
      }
    }, this.pollIntervalMs);
  }

  stop() {
    if (!this.interval) {
      return;
    }

    clearInterval(this.interval);
    this.interval = undefined;
  }

  private async poll() {
    const currentPorts = await this.getListeningPorts();

    for (const [port, info] of currentPorts) {
      if (!this.previousPorts.has(port)) {
        this.emit('port:opened', info);
      }
    }

    for (const [port, info] of this.previousPorts) {
      if (!currentPorts.has(port)) {
        this.emit('port:closed', info);
      }
    }

    this.previousPorts = currentPorts;
  }

  private async getListeningPorts(): Promise<Map<number, PortInfo>> {
    const { stdout } = await execAsync('ss -ltnpH');

    const ports = new Map<number, PortInfo>();

    for (const line of stdout.split('\n')) {
      if (!line.trim()) continue;

      const parts = line.trim().split(/\s+/);

      if (parts.length < 5) continue;

      const localAddress = parts[3];

      if (localAddress?.startsWith('127.0.0.11:')) {
        continue;
      }
      const port = Number(localAddress?.substring(localAddress.lastIndexOf(':') + 1));

      if (Number.isNaN(port)) continue;
      // Ignore system and reserved ports
      if (port < 1024) continue;
      // Ignore configured ports
      if (this.ignoredPorts.has(port)) continue;

      let pid: number | undefined;
      let process: string | undefined;

      const processMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/);

      if (processMatch) {
        process = processMatch[1];
        pid = Number(processMatch[2]);
      }

      ports.set(port, {
        port,
        pid,
        process,
      });
    }

    return ports;
  }
}
