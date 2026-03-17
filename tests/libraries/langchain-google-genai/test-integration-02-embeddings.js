import assert from 'assert';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

export const run = async () => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: 'test-key',
    model: 'embedding-001',
    baseUrl: 'http://localhost:18080',
  });

  const queryVector = await embeddings.embedQuery('cat');
  assert.deepStrictEqual(queryVector, [3.1, 3.2, 3.3]);

  const docVectors = await embeddings.embedDocuments(['alpha', 'beta']);
  assert.deepStrictEqual(docVectors, [
    [5.1, 5.2, 5.3],
    [4.1, 4.2, 4.3],
  ]);

  return 'PASS: GoogleGenerativeAIEmbeddings uses mock HTTP embed and batch-embed endpoints correctly';
};
