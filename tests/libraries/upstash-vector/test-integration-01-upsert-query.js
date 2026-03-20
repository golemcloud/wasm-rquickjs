import assert from 'assert';
import { Index } from '@upstash/vector';

export const run = async () => {
  const index = new Index({
    url: 'http://localhost:18080',
    token: 'test-token',
  });

  const upsertResult = await index.upsert({
    id: 'vec-1',
    vector: [0.1, 0.2, 0.3],
    metadata: { topic: 'integration' },
  });

  const queryResult = await index.query({
    vector: [0.1, 0.2, 0.3],
    topK: 1,
    includeMetadata: true,
  });

  assert.strictEqual(upsertResult, 'Success');
  assert.strictEqual(queryResult.length, 1);
  assert.strictEqual(queryResult[0].id, 'vec-1');
  assert.strictEqual(queryResult[0].metadata.topic, 'integration');

  return 'PASS: HTTP upsert and query work against mock Upstash endpoint';
};
