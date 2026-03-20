import assert from 'assert';
import { Pinecone } from '@pinecone-database/pinecone';

export const run = () => {
  const pc = new Pinecone({ apiKey: 'test-api-key' });

  assert.throws(
    () => pc.index({}),
    (error) => {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes('Either name or host must be provided'));
      return true;
    }
  );

  return 'PASS: index factory validates required name or host';
};
