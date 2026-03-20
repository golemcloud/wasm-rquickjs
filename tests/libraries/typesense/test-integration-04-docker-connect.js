import assert from 'assert';
import { Client } from 'typesense';

const client = new Client({
  nodes: [{ host: 'localhost', port: 18108, protocol: 'http' }],
  apiKey: 'xyz',
  randomizeNodes: false,
  connectionTimeoutSeconds: 2,
});

export const run = async () => {
  const health = await client.health.retrieve();
  assert.strictEqual(health.ok, true);

  const collectionName = `docker_books_connect_${Date.now()}`;
  const created = await client.collections().create({
    name: collectionName,
    fields: [{ name: 'title', type: 'string' }],
  });
  assert.strictEqual(created.name, collectionName);

  const listed = await client.collections().retrieve();
  assert.ok(listed.some((collection) => collection.name === collectionName));

  await client.collections(collectionName).delete();

  return 'PASS: connected to Docker Typesense and completed collection create/list/delete';
};
