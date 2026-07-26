import { WebSocketServer } from 'ws';

import { handleConnection } from './connection-manager';
import { ROOT_DIR } from './lib/constants';
import { OrchestratorService } from './services/orchestrator.service';
import { PortWatcher } from './services/port.service';
import { TaskManagerService } from './services/task-manager.service';

const wss = new WebSocketServer({ port: 9999 });
const portWatcher = new PortWatcher(1000);
const taskManager = TaskManagerService.getInstance();

const repoUrl = process.env.REPO_URL ?? 'https://github.com/mikro-orm/express-js-example-app.git';
const installCommand = process.env.INSTALL_CMD ?? 'npm i';
const buildCommand = process.env.BUILD_CMD ?? 'npm run build';
const startCommand = process.env.START_CMD ?? 'npm run start';

taskManager
  .setupContainer({
    gitRepoUrl: repoUrl,
    installDepsCommand: installCommand,
    buildCommand,
    startDevServerCommand: startCommand,
    rootDir: ROOT_DIR,
  })
  .catch((error) => {
    console.error('Failed to setup container:', error);
  });

wss.on('connection', handleConnection);
portWatcher.on('port:opened', async (portInfo) => {
  console.log('OPENED', portInfo);
  await OrchestratorService.createProcess(portInfo.port);
});

portWatcher.start();
wss.on('listening', () => {
  console.log('Container runtime websocket server is listening on port 9999!');
});
