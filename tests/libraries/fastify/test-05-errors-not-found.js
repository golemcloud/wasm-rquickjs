import assert from 'node:assert';
import Fastify from 'fastify';

export const run = async () => {
  const app = Fastify({ logger: false });

  app.setErrorHandler(async (error, _request, reply) => {
    reply.code(418);
    return {
      handled: true,
      message: error.message,
    };
  });

  app.setNotFoundHandler(async (request, reply) => {
    reply.code(404);
    return {
      notFound: true,
      url: request.url,
    };
  });

  app.get('/boom', async () => {
    throw new Error('explode');
  });

  const errored = await app.inject({ method: 'GET', url: '/boom' });
  assert.strictEqual(errored.statusCode, 418);
  assert.deepStrictEqual(errored.json(), {
    handled: true,
    message: 'explode',
  });

  const missing = await app.inject({ method: 'GET', url: '/missing' });
  assert.strictEqual(missing.statusCode, 404);
  assert.deepStrictEqual(missing.json(), {
    notFound: true,
    url: '/missing',
  });

  await app.close();
  return 'PASS: fastify custom error and not-found handlers work via inject';
};
