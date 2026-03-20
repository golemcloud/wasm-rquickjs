import assert from 'assert';
import { Pinecone } from '@pinecone-database/pinecone';

export const run = () => {
  const pc = new Pinecone({ apiKey: 'test-api-key' });

  assert.throws(
    () => pc.assistant({ name: '   ' }),
    (error) => {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes('Assistant name is required'));
      return true;
    }
  );

  return 'PASS: assistant factory rejects empty assistant names';
};
