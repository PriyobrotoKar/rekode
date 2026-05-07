import { WebSocket } from 'ws';

import { WsNamespace } from './lib/constants';
import { FileManager } from './services/file-manager.service';
import { TerminalSession } from './services/terminal.service';

export function handleConnection(ws: WebSocket) {
  const terminal = new TerminalSession();
  const fileManager = new FileManager();

  fileManager
    .getAllFiles()
    .then((files) => {
      console.log('All files loaded!');
      ws.send(JSON.stringify({ namespace: WsNamespace.FILES_LOADED, payload: files }));
    })
    .catch((error) => {
      console.error(error);
    });

  terminal.onData((data) => {
    const payload = JSON.stringify({ namespace: WsNamespace.TERMINAL_OUTPUT, payload: data });
    ws.send(payload);
  });

  ws.on('message', (msg) => {
    const parsed = JSON.parse(msg.toString());

    switch (parsed.namespace) {
      case WsNamespace.TERMINAL_INPUT:
        terminal.write(parsed.payload);
        break;

      case WsNamespace.TERMINAL_RESIZE:
        terminal.resize(parsed.payload.cols, parsed.payload.rows);
        break;

      case WsNamespace.FILE_REQUESTED:
        fileManager
          .getFile(parsed.payload.path)
          .then((file) => {
            ws.send(JSON.stringify({ namespace: WsNamespace.FILE_READ, payload: file }));
          })
          .catch((error) => {
            console.error(error);
          });
        break;
    }
  });

  ws.on('close', () => {
    terminal.dispose();
  });
}
