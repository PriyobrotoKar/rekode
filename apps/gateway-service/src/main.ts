import { proxy } from './proxy';
import { app } from './server';

try {
  const appServerAddress = await app.listen({ port: 8080 });
  const proxyServerAddress = await proxy.listen({ port: 8081 });
  app.log.info(`Gateway Service is listening at ${appServerAddress}`);
  app.log.info(`Gateway Proxy Service is listening at ${proxyServerAddress}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
