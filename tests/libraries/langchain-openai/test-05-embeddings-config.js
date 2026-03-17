import assert from 'assert';
import { OpenAIEmbeddings } from '@langchain/openai';

export const run = () => {
  const embeddings = new OpenAIEmbeddings({
    apiKey: 'test-key',
    model: 'text-embedding-3-small',
    dimensions: 64,
    batchSize: 7,
    maxRetries: 0,
  });

  assert.strictEqual(embeddings.model, 'text-embedding-3-small');
  assert.strictEqual(embeddings.batchSize, 7);
  assert.strictEqual(embeddings.dimensions, 64);
  assert.strictEqual(embeddings.stripNewLines, true);
  assert.strictEqual(typeof embeddings.embedQuery, 'function');
  assert.strictEqual(typeof embeddings.embedDocuments, 'function');

  assert.ok(embeddings.caller, 'Expected embeddings caller to be configured');
  assert.strictEqual(embeddings.client, undefined);

  return 'PASS: OpenAIEmbeddings constructs offline with expected configuration fields';
};
