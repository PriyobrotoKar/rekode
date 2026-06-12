import httpProxy from '@fastify/http-proxy';
import Fastify from 'fastify';

const proxy = Fastify({
  logger: true,
});
proxy.register(httpProxy, {
  upstream: '',
  websocket: true,
});

export { proxy };
