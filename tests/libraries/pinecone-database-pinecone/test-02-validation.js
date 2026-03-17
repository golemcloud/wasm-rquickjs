import assert from 'assert';
import { Pinecone } from '@pinecone-database/pinecone';

export const run = () => {
  assert.throws(
    () => new Pinecone({}),
    (error) => {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes('apiKey'));
      return true;
    }
  );

  return 'PASS: constructor enforces apiKey configuration';
};
