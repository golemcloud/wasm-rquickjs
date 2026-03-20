import assert from 'node:assert';
import { QdrantClient } from '@qdrant/js-client-rest';

export const run = async () => {
  const client = new QdrantClient({
    url: 'http://localhost:16333',
    timeout: 15000,
    checkCompatibility: false,
  });

  const info = await client.versionInfo();
  assert.ok(typeof info.version === 'string' && info.version.length > 0);

  const collections = await client.getCollections();
  assert.ok(Array.isArray(collections.collections));

  return 'PASS: connects to Docker Qdrant and reads metadata';
};
