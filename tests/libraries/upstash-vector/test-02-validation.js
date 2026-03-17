import assert from 'assert';
import { Index } from '@upstash/vector';

export const run = async () => {
  assert.throws(
    () => new Index({}),
    Error,
  );

  const index = new Index({
    request: async () => ({ result: [] }),
  });

  let rejected = false;
  try {
    await index.query({ topK: 1 });
  } catch (error) {
    rejected = true;
    assert.ok(error instanceof Error);
    assert.ok(error.message.includes('Either data, vector or sparseVector should be provided.'));
  }
  assert.ok(rejected);

  return 'PASS: missing credentials and invalid query payloads are rejected';
};
