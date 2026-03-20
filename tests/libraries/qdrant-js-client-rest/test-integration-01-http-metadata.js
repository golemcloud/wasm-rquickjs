import assert from 'node:assert';
import { QdrantClient } from '@qdrant/js-client-rest';

export const run = async () => {
  const client = new QdrantClient({
    url: 'http://localhost:18080',
    timeout: 2000,
    checkCompatibility: false,
  });

  const info = await client.versionInfo();
  assert.strictEqual(info.version, '1.14.0-mock');

  const collections = await client.getCollections();
  assert.ok(Array.isArray(collections.collections));

  const existing = await client.collectionExists('mock_vectors');
  const missing = await client.collectionExists('missing_vectors');
  assert.strictEqual(existing.exists, true);
  assert.strictEqual(missing.exists, false);

  return 'PASS: metadata endpoints return expected values over HTTP mock';
};
