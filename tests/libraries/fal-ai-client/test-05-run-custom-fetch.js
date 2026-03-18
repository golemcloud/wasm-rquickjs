import assert from 'assert';
import { createFalClient } from '@fal-ai/client';

export const run = async () => {
  const calls = [];

  const client = createFalClient({
    credentials: 'test-key:test-secret',
    fetch: async (url, init) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          output: 'ok',
          receivedPrompt: JSON.parse(init.body).prompt,
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'x-fal-request-id': 'req-run-custom-fetch',
          },
        },
      );
    },
  });

  const result = await client.run('fal-ai/test-model', {
    input: { prompt: 'hello from custom fetch' },
    startTimeout: 3,
  });

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].url, 'https://fal.run/fal-ai/test-model');
  assert.strictEqual(calls[0].init.method, 'POST');
  assert.strictEqual(calls[0].init.headers.Authorization, 'Key test-key:test-secret');
  assert.strictEqual(calls[0].init.headers['x-fal-request-timeout'], '3');

  assert.strictEqual(result.requestId, 'req-run-custom-fetch');
  assert.deepStrictEqual(result.data, {
    output: 'ok',
    receivedPrompt: 'hello from custom fetch',
  });

  return 'PASS: run() builds authenticated requests and parses JSON responses';
};
