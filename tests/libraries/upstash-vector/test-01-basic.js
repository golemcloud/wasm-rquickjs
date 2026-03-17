import assert from 'assert';
import { Index } from '@upstash/vector';

export const run = async () => {
  const calls = [];
  const requester = {
    request: async (req) => {
      calls.push(req);
      if (`${req.path}`.includes('upsert')) {
        return { result: 'Success' };
      }
      if (`${req.path}`.includes('query')) {
        return {
          result: [{ id: 'doc-1', score: 1, metadata: { source: 'offline' } }],
        };
      }
      throw new Error(`Unexpected endpoint: ${req.path}`);
    },
  };

  const index = new Index(requester);
  const upsertResult = await index.upsert({
    id: 'doc-1',
    vector: [0.1, 0.2, 0.3],
    metadata: { source: 'offline' },
  });
  const queryResult = await index.query({ vector: [0.1, 0.2, 0.3], topK: 1, includeMetadata: true });

  assert.strictEqual(upsertResult, 'Success');
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(queryResult.length, 1);
  assert.strictEqual(queryResult[0].id, 'doc-1');
  assert.strictEqual(queryResult[0].metadata.source, 'offline');

  return 'PASS: basic upsert/query flow via custom Requester';
};
