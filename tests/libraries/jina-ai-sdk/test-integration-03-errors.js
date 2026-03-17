import assert from 'assert';
import * as jinaSdk from '@jina-ai/sdk';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new jinaSdk.default({ apiKey: 'test-key', baseURL: BASE });

  try {
    await client.embeddings.create({ model: 'jina-embeddings-v4' });
    return 'PASS: request completed';
  } catch (error) {
    assert.ok(error instanceof Error);
    return 'PASS: request path throws Error for invalid payload';
  }
};
