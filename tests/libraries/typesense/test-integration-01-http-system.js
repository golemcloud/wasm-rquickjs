import assert from 'assert';
import { Client } from 'typesense';

const client = new Client({
  nodes: [{ host: 'localhost', port: 18080, protocol: 'http' }],
  apiKey: 'test-api-key',
  randomizeNodes: false,
  connectionTimeoutSeconds: 2,
});

export const run = async () => {
  const health = await client.health.retrieve();
  assert.strictEqual(health.ok, true);

  const schema = {
    name: 'mock_books_system',
    fields: [
      { name: 'title', type: 'string' },
      { name: 'year', type: 'int32', optional: true },
    ],
    default_sorting_field: 'year',
  };

  const created = await client.collections().create(schema);
  assert.strictEqual(created.name, schema.name);

  const listed = await client.collections().retrieve();
  assert.ok(Array.isArray(listed));
  assert.ok(listed.some((collection) => collection.name === schema.name));

  const retrieved = await client.collections(schema.name).retrieve();
  assert.strictEqual(retrieved.name, schema.name);

  await client.collections(schema.name).delete();

  return 'PASS: health and collection lifecycle work against HTTP mock server';
};
