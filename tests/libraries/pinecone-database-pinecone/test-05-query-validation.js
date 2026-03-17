import assert from 'assert';
import { Pinecone } from '@pinecone-database/pinecone';

export const run = async () => {
  let fetchCalls = 0;
  const pc = new Pinecone({
    apiKey: 'test-api-key',
    fetchApi: async () => {
      fetchCalls += 1;
      throw new Error('fetch should not be called for invalid query');
    },
  });

  const index = pc.index({ host: 'http://localhost:18080' });

  await assert.rejects(
    () => index.query({ topK: 0, vector: [0.1, 0.2] }),
    (error) => {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes('topK') || error.message.includes('greater than 0'));
      return true;
    }
  );

  assert.strictEqual(fetchCalls, 0);

  return 'PASS: query input validation fails before any network call';
};
