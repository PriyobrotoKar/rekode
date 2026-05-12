import { WebSocketServer } from 'ws';

import { handleConnection } from './connection-manager';
import { ROOT_DIR } from './lib/constants';
import { TaskManagerService } from './services/task-manager.service';

const wss = new WebSocketServer({ port: 9999 });
const taskManager = TaskManagerService.getInstance();
const repoUrl = process.env.REPO_URL ?? 'https://github.com/mikro-orm/express-js-example-app.git';

taskManager
  .setupContainer({
    gitRepoUrl: repoUrl,
    installDepsCommand: 'npm i',
    rootDir: ROOT_DIR,
  })
  .catch((error) => {
    console.error('Failed to setup container:', error);
  });

wss.on('connection', handleConnection);

wss.on('listening', () => {
  console.log('Container runtime websocket server is listening on port 9999!');
});
