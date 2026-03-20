import assert from 'assert';
import * as jinaSdk from '@jina-ai/sdk';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new jinaSdk.default({ apiKey: 'test-key', baseURL: BASE });
  const result = await client.embeddings.create({
    model: 'jina-embeddings-v4',
    input: ['hello world'],
  });

  assert.ok(result);
  return 'PASS: embeddings request to mock server succeeds';
};
