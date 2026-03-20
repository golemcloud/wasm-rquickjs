import assert from 'node:assert';
import Fastify from 'fastify';

export const run = async () => {
  const app = Fastify({ logger: false });
  const observed = [];

  app.decorate('buildGreeting', (name) => `hi ${name}`);
  app.decorateRequest('traceId', null);

  app.addHook('onRequest', async (request) => {
    observed.push('onRequest');
    request.traceId = request.headers['x-trace-id'] || 'generated-trace';
  });

  app.addHook('preHandler', async () => {
    observed.push('preHandler');
  });

  app.get('/hooks/:name', async (request) => {
    observed.push('handler');
    return {
      traceId: request.traceId,
      message: request.server.buildGreeting(request.params.name),
      observed: observed.slice(),
    };
  });

  const response = await app.inject({
    method: 'GET',
    url: '/hooks/bob',
    headers: {
      'x-trace-id': 'trace-123',
    },
  });

  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(response.json(), {
    traceId: 'trace-123',
    message: 'hi bob',
    observed: ['onRequest', 'preHandler', 'handler'],
  });

  await app.close();
  return 'PASS: fastify hooks and decorators are applied in request lifecycle';
};
