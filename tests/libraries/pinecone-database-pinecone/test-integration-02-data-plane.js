import assert from 'assert';
import { Pinecone } from '@pinecone-database/pinecone';

export const run = async () => {
  const pc = new Pinecone({
    apiKey: 'test-api-key',
    maxRetries: 0,
  });

  const index = pc.index({ host: 'http://localhost:18080', namespace: 'demo' });

  await index.upsert({
    records: [
      { id: 'vec-1', values: [0.1, 0.2, 0.3], metadata: { topic: 'alpha' } },
      { id: 'vec-2', values: [0.9, 0.8, 0.7], metadata: { topic: 'beta' } },
    ],
  });

  const query = await index.query({
    vector: [0.1, 0.2, 0.3],
    topK: 2,
    includeMetadata: true,
  });
  assert.ok(Array.isArray(query.matches));
  assert.ok(query.matches.length >= 1);
  assert.strictEqual(query.matches[0].id, 'vec-1');

  const fetched = await index.fetch({ ids: ['vec-1'] });
  assert.ok(fetched.records['vec-1']);
  assert.deepStrictEqual(fetched.records['vec-1'].values, [0.1, 0.2, 0.3]);

  return 'PASS: data-plane upsert/query/fetch work via HTTP mock server';
};
