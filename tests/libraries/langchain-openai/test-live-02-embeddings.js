import assert from 'assert';
import { OpenAIEmbeddings } from '@langchain/openai';

export const run = async () => {
  const apiKey = process.env.OPENAI_API_KEY || 'missing-openai-api-key';

  const embeddings = new OpenAIEmbeddings({
    apiKey,
    model: 'text-embedding-3-small',
    maxRetries: 0,
  });

  const vector = await embeddings.embedQuery('hello from langchain-openai compatibility test');
  assert.ok(Array.isArray(vector), 'Expected embedQuery to return an array');
  assert.ok(vector.length > 100, `Expected embedding length > 100, got ${vector.length}`);

  return 'PASS: live embeddings request returns a valid vector';
};
