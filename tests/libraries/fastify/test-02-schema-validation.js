import assert from 'node:assert';
import Fastify from 'fastify';

export const run = async () => {
  const app = Fastify({ logger: false });

  app.post('/users', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'age'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 2 },
          age: { type: 'integer', minimum: 0 },
        },
      },
      response: {
        201: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    reply.code(201);
    return {
      id: `user-${request.body.name.toLowerCase()}`,
      name: request.body.name,
    };
  });

  const invalid = await app.inject({
    method: 'POST',
    url: '/users',
    payload: {
      name: 'A',
      age: 'old',
    },
  });

  assert.strictEqual(invalid.statusCode, 400);
  const invalidJson = invalid.json();
  assert.strictEqual(invalidJson.error, 'Bad Request');

  const valid = await app.inject({
    method: 'POST',
    url: '/users',
    payload: {
      name: 'Alice',
      age: 42,
    },
  });

  assert.strictEqual(valid.statusCode, 201);
  assert.deepStrictEqual(valid.json(), {
    id: 'user-alice',
    name: 'Alice',
  });

  await app.close();
  return 'PASS: fastify schema validation and response serialization work';
};
