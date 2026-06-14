import { proxy } from './proxy';
import { app } from './server';

try {
  const appServerAddress = await app.listen({ port: 8080, host: '0.0.0.0' });
  const proxyServerAddress = await proxy.listen({ port: 8081, host: '0.0.0.0' });
  app.log.info(`Gateway Service is listening at ${appServerAddress}`);
  app.log.info(`Gateway Proxy Service is listening at ${proxyServerAddress}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
