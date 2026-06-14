import httpProxy from '@fastify/http-proxy';
import Fastify from 'fastify';

const proxy = Fastify({
  logger: true,
});
proxy.register(httpProxy, {
  upstream: '',
  http: {},
  websocket: true,
  replyOptions: {
    getUpstream: (request) => {
      const containerName = request.host.split('.')[0];
      console.log(`Upstream: ${containerName}`);
      const isWebSocket = request.headers?.upgrade?.toLowerCase() === 'websocket';
      const port = isWebSocket ? 9999 : 4321;
      return `http://${containerName}:${port}`;
    },
    rewriteRequestHeaders: (_req, headers) => {
      headers.host = 'localhost:4321';
      return headers;
    },
  },
  wsClientOptions: {
    headers: {
      host: 'localhost:9999',
    },
  },
  disableCache: true,
  cacheURLs: 0,
});

export { proxy };
