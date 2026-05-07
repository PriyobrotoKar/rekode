import { spawn } from 'node-pty';

export class TerminalSession {
  private readonly pty;

  constructor() {
    this.pty = spawn('bash', [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd: '../workspace',
      env: {
        ...process.env,
        TERM: 'xterm-256color',
      },
    });

    this.pty.onExit((e) => {
      console.log('PTY exited', e);
    });
  }

  write(data: string) {
    this.pty.write(data);
  }

  onData(callback: (data: string) => void) {
    this.pty.onData((data) => {
      callback(data);
    });
  }

  resize(cols: number, rows: number) {
    cols = Number(cols);
    rows = Number(rows);

    if (Number.isInteger(cols) && Number.isInteger(rows) && cols > 0 && rows > 0) {
      this.pty.resize(cols, rows);
    }
  }

  dispose() {
    this.pty.kill();
  }
}
