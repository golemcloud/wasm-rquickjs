import assert from 'assert';
import { OpenAIEmbeddings } from '@langchain/openai';

export const run = async () => {
  const embeddings = new OpenAIEmbeddings({
    apiKey: 'test-key',
    model: 'text-embedding-3-small',
    encodingFormat: 'float',
    batchSize: 2,
    maxRetries: 0,
    configuration: {
      baseURL: 'http://localhost:18080/v1',
    },
  });

  const vectors = await embeddings.embedDocuments(['alpha', 'beta']);
  assert.strictEqual(vectors.length, 2);
  assert.strictEqual(vectors[0].length, 3);
  assert.strictEqual(vectors[1].length, 3);
  assert.deepStrictEqual(Array.from(vectors[0]), [5, 6, 7]);
  assert.deepStrictEqual(Array.from(vectors[1]), [4, 5, 6]);

  return 'PASS: OpenAIEmbeddings performs real HTTP call to mock embeddings endpoint';
};
