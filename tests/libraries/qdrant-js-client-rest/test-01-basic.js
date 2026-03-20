import assert from 'node:assert';
import { QdrantClient } from '@qdrant/js-client-rest';

export const run = () => {
  const client = new QdrantClient({
    url: 'http://localhost:18080',
    timeout: 1234,
    checkCompatibility: false,
  });

  assert.strictEqual(typeof client.api, 'function');
  assert.strictEqual(typeof client.versionInfo, 'function');
  assert.strictEqual(typeof client.getCollections, 'function');
  assert.strictEqual(typeof client.query, 'function');

  const api = client.api();
  assert.strictEqual(typeof api.root, 'function');
  assert.strictEqual(typeof api.getCollections, 'function');
  assert.strictEqual(typeof api.queryPoints, 'function');

  return 'PASS: QdrantClient exposes expected API surface';
};
