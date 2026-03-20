import assert from 'node:assert';
import Fastify from 'fastify';

export const run = async () => {
  const app = Fastify({ logger: false });

  app.get('/hello/:name', async (request) => {
    return {
      greeting: `hello ${request.params.name}`,
      lang: request.query.lang || 'en',
    };
  });

  const response = await app.inject({
    method: 'GET',
    url: '/hello/alice?lang=fr',
  });

  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(response.json(), {
    greeting: 'hello alice',
    lang: 'fr',
  });

  await app.close();
  return 'PASS: fastify basic route registration and inject request work';
};
