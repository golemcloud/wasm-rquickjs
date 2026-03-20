import assert from 'assert';
import { createMockFalClient } from './helpers.js';

export const run = async () => {
  const client = createMockFalClient();

  const result = await client.run('fal-ai/test-model', {
    input: { prompt: 'run me' },
  });

  assert.strictEqual(result.requestId, 'run-req-1');
  assert.deepStrictEqual(result.data, {
    output: 'run:run me',
    authHeader: 'Key test-key:test-secret',
  });

  return 'PASS: run() works against mock HTTP server via proxy middleware';
};
