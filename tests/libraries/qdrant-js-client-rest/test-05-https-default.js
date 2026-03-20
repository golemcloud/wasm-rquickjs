import assert from 'node:assert';
import { QdrantClient } from '@qdrant/js-client-rest';

export const run = () => {
  const secureClient = new QdrantClient({
    host: 'example.com',
    apiKey: 'test-key',
    checkCompatibility: false,
  });

  const insecureClient = new QdrantClient({
    host: 'localhost',
    port: 18080,
    checkCompatibility: false,
  });

  assert.strictEqual(typeof secureClient.versionInfo, 'function');
  assert.strictEqual(typeof insecureClient.versionInfo, 'function');
  assert.strictEqual(typeof secureClient.api().root, 'function');

  return 'PASS: constructor accepts apiKey mode and plain HTTP mode';
};
