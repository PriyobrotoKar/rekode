import Fastify from 'fastify';

import { ApiGatewayService } from './lib/api';
import { client } from './lib/redis';

// TODO: Add authentication and authorization to this proxy server
const app = Fastify({
  logger: true,
});

app.get('/health', async () => {
  return {
    status: 'ok',
  };
});

app.post('/process', async (request, reply) => {
  const { name, port } = request.body as { name: string; port: number };
  await client.set(`container:${name}`, port);
  return reply.code(200).send({ message: `container:${name} port:${port} set successfully` });
});

app.delete('/process/:name', async (request, reply) => {
  const { name } = request.params as { name: string };
  await client.del(`container:${name}`);
  await ApiGatewayService.fetch(`/project/${name}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 7,
    }),
  });
  return reply.code(200).send({ message: `container:${name} deleted successfully` });
});

export { app };
