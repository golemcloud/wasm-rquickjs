import assert from 'assert';
import * as jinaSdk from '@jina-ai/sdk';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new jinaSdk.default({ apiKey: 'test-key', baseURL: BASE });
  const result = await client.rerank({
    model: 'jina-reranker-v2-base-multilingual',
    query: 'find fruits',
    documents: ['apple', 'car'],
  });

  assert.ok(result);
  return 'PASS: rerank request to mock server succeeds';
};
