import assert from 'node:assert';
import { QdrantClient } from '@qdrant/js-client-rest';

export const run = async () => {
  const client = new QdrantClient({
    url: 'http://localhost:18080/prefixed',
    timeout: 2000,
    checkCompatibility: false,
    headers: {
      'x-test-suite': 'qdrant-js-client-rest',
    },
  });

  const info = await client.versionInfo();

  assert.strictEqual(info.version, '1.14.0-mock');
  assert.strictEqual(info.title, 'qdrant');

  return 'PASS: prefixed URL and custom headers work for versionInfo';
};
