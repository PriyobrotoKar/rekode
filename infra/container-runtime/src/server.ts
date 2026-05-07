import { WebSocketServer } from 'ws';

import { handleConnection } from './connection-manager';
import { loadFilesFromRepo } from './lib/load-files';

const wss = new WebSocketServer({ port: 9999 });

loadFilesFromRepo('https://github.com/mikro-orm/express-js-example-app.git');

wss.on('connection', handleConnection);

wss.on('listening', () => {
  console.log('Container runtime websocket server is listening on port 9999!');
});
