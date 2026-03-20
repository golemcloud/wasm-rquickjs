import assert from 'node:assert';
import { QdrantClient } from '@qdrant/js-client-rest';

export const run = async () => {
  const client = new QdrantClient({
    url: 'http://localhost:18080',
    timeout: 2000,
    checkCompatibility: false,
  });

  const createResult = await client.createCollection('books', {
    vectors: {
      size: 3,
      distance: 'Cosine',
    },
  });
  assert.strictEqual(createResult.status, 'acknowledged');

  const existsAfterCreate = await client.collectionExists('books');
  assert.strictEqual(existsAfterCreate.exists, true);

  const collection = await client.getCollection('books');
  assert.strictEqual(collection.config.params.vectors.size, 3);

  const deleteResult = await client.deleteCollection('books');
  assert.strictEqual(deleteResult.status, 'acknowledged');

  const existsAfterDelete = await client.collectionExists('books');
  assert.strictEqual(existsAfterDelete.exists, false);

  return 'PASS: create/get/delete collection works against HTTP mock';
};
