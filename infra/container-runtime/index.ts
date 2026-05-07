import { spawn } from 'node-pty';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 9999 });

const TERMINAL_OUTPUT_NAMESPACE = 'terminal.output';
const TERMINAL_INPUT_NAMESPACE = 'terminal.input';
const TERMINAL_RESIZE_NAMESPACE = 'terminal.resize';

wss.on('connection', (ws) => {
  const ptyProcess = spawn('bash', [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: '/workspace',
    env: {
      ...process.env,
      TERM: 'xterm-256color',
    },
  });

  ptyProcess.onData((data) => {
    console.log('onData', data);
    ws.send(
      JSON.stringify({
        namespace: TERMINAL_OUTPUT_NAMESPACE,
        payload: data,
      }),
    );
  });

  ptyProcess.onExit((e) => {
    console.log('PTY exited', e);
  });

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());

      if (parsed?.namespace === TERMINAL_INPUT_NAMESPACE && typeof parsed?.payload === 'string') {
        console.log('onCommand', parsed.payload);
        ptyProcess.write(parsed.payload);

        return;
      }

      if (parsed?.namespace === TERMINAL_RESIZE_NAMESPACE && parsed?.payload) {
        const cols = Number(parsed.payload.cols);
        const rows = Number(parsed.payload.rows);

        if (Number.isInteger(cols) && Number.isInteger(rows) && cols > 0 && rows > 0) {
          ptyProcess.resize(cols, rows);
        }

        return;
      }

      if (typeof parsed?.command === 'string') {
        console.log('onCommand', parsed.command);
        ptyProcess.write(parsed.command);
      }
    } catch {
      ptyProcess.write(msg.toString());
    }
  });
});
