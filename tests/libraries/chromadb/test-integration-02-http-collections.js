import assert from 'assert';
import { ChromaClient } from 'chromadb';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  const client = new ChromaClient({ path: BASE_URL });
  const name = `mock-collections-${Date.now()}`;

  const created = await client.createCollection({ name, embeddingFunction: null });
  assert.strictEqual(created.name, name);
  assert.ok(created.id.startsWith('mock-col-'));

  const listed = await client.listCollections();
  assert.ok(listed.some((collection) => collection.name === name));

  const fetched = await client.getCollection({ name });
  assert.strictEqual(fetched.id, created.id);

  const beforeDeleteCount = await client.countCollections();
  await client.deleteCollection({ name });
  const afterDeleteCount = await client.countCollections();
  assert.strictEqual(afterDeleteCount, beforeDeleteCount - 1);

  return 'PASS: collection lifecycle operations work over HTTP (create/list/get/count/delete)';
};
