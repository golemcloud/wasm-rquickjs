import assert from 'node:assert';
import Fastify from 'fastify';

export const run = async () => {
  const app = Fastify({ logger: false });

  app.route({
    method: 'GET',
    url: '/items/:id',
    handler: async (request) => ({
      id: request.params.id,
    }),
  });

  app.route({
    method: 'POST',
    url: '/items',
    handler: async (_request, reply) => {
      reply.code(201);
      return { created: true };
    },
  });

  assert.strictEqual(app.hasRoute({ method: 'GET', url: '/items/:id' }), true);
  assert.strictEqual(app.hasRoute({ method: 'DELETE', url: '/items/:id' }), false);

  const found = app.findRoute({ method: 'GET', url: '/items/:id' });
  assert.ok(found);
  assert.strictEqual(typeof found.handler, 'function');

  const routesDump = app.printRoutes();
  assert.ok(routesDump.includes('items'));

  const getResponse = await app.inject({ method: 'GET', url: '/items/42' });
  assert.strictEqual(getResponse.statusCode, 200);
  assert.deepStrictEqual(getResponse.json(), { id: '42' });

  await app.close();
  return 'PASS: fastify route introspection and request dispatch work';
};
