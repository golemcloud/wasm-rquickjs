import assert from 'assert';
import { VoyageAIClient } from 'voyageai';

const BASE_URL = 'http://localhost:18080/v1';

export const run = async () => {
  const client = new VoyageAIClient({
    apiKey: 'integration-key',
    baseUrl: BASE_URL,
  });

  const documents = ['first', 'second', 'third'];
  const result = await client.rerank({
    model: 'rerank-2',
    query: 'pick best',
    documents,
    returnDocuments: true,
  });

  assert.strictEqual(result.model, 'rerank-2');
  assert.strictEqual(result.data[0].index, 2);
  assert.ok((result.data[0].relevanceScore ?? result.data[0].relevance_score) > 0.9);
  assert.strictEqual(result.data[0].document, 'third');
  return 'PASS: rerank() works against local mock HTTP server';
};
