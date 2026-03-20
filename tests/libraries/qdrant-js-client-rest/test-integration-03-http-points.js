import assert from 'node:assert';
import { QdrantClient } from '@qdrant/js-client-rest';

export const run = async () => {
  const client = new QdrantClient({
    url: 'http://localhost:18080',
    timeout: 3000,
    checkCompatibility: false,
  });

  await client.createCollection('mock_vectors', {
    vectors: {
      size: 3,
      distance: 'Cosine',
    },
  });

  await client.upsert('mock_vectors', {
    points: [
      { id: 1, vector: [0.9, 0.1, 0.0], payload: { label: 'alpha' } },
      { id: 2, vector: [0.2, 0.7, 0.1], payload: { label: 'beta' } },
      { id: 3, vector: [0.8, 0.2, 0.0], payload: { label: 'gamma' } },
    ],
  });

  const count = await client.count('mock_vectors', { exact: true });
  assert.strictEqual(count.count, 3);

  const result = await client.query('mock_vectors', {
    query: [1, 0, 0],
    limit: 2,
    with_payload: true,
  });

  assert.strictEqual(result.points.length, 2);
  assert.strictEqual(result.points[0].id, 1);
  assert.strictEqual(result.points[0].payload.label, 'alpha');

  return 'PASS: upsert, count, and query work against HTTP mock';
};
