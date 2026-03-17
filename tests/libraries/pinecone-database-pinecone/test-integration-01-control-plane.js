import assert from 'assert';
import { Pinecone } from '@pinecone-database/pinecone';

export const run = async () => {
  const pc = new Pinecone({
    apiKey: 'test-api-key',
    controllerHostUrl: 'http://localhost:18080',
    maxRetries: 0,
  });

  const listed = await pc.listIndexes();
  assert.ok(Array.isArray(listed.indexes));
  assert.strictEqual(listed.indexes.length, 1);
  assert.strictEqual(listed.indexes[0].name, 'mock-index');

  const described = await pc.describeIndex('mock-index');
  assert.strictEqual(described.name, 'mock-index');
  assert.strictEqual(described.host, 'localhost:18080');
  assert.strictEqual(described.status.ready, true);

  return 'PASS: control-plane listIndexes/describeIndex work via HTTP mock server';
};
