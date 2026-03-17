import assert from 'node:assert';
import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION = 'docker_vectors';

export const run = async () => {
  const client = new QdrantClient({
    url: 'http://localhost:16333',
    timeout: 15000,
    checkCompatibility: false,
  });

  const alreadyExists = await client.collectionExists(COLLECTION);
  if (alreadyExists.exists) {
    await client.deleteCollection(COLLECTION);
  }

  await client.createCollection(COLLECTION, {
    vectors: {
      size: 3,
      distance: 'Cosine',
    },
  });

  await client.upsert(COLLECTION, {
    points: [
      { id: 1, vector: [1, 0, 0], payload: { label: 'one' } },
      { id: 2, vector: [0, 1, 0], payload: { label: 'two' } },
    ],
  });

  const count = await client.count(COLLECTION, { exact: true });
  assert.strictEqual(count.count, 2);

  const query = await client.query(COLLECTION, {
    query: [1, 0, 0],
    limit: 1,
    with_payload: true,
  });
  assert.strictEqual(query.points.length, 1);
  assert.strictEqual(query.points[0].id, 1);
  assert.strictEqual(query.points[0].payload.label, 'one');

  await client.deleteCollection(COLLECTION);
  const existsAfterDelete = await client.collectionExists(COLLECTION);
  assert.strictEqual(existsAfterDelete.exists, false);

  return 'PASS: collection CRUD and vector query work against Docker Qdrant';
};
