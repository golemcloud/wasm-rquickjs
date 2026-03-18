import assert from 'assert';
import Cartesia from '@cartesia/cartesia-js';

export const run = async () => {
  const client = new Cartesia({
    token: 'test-token',
    baseURL: 'http://localhost:18080',
    timeout: 60_000,
    maxRetries: 2,
  });

  const tuned = client.withOptions({
    timeout: 4321,
    maxRetries: 7,
    defaultHeaders: {
      'x-test-suite': 'cartesia',
    },
  });

  const built = await tuned.buildRequest(
    {
      method: 'get',
      path: '/voices',
    },
    { retryCount: 2 },
  );

  const headers = new Headers(built.req.headers);
  assert.strictEqual(built.timeout, 4321);
  assert.strictEqual(headers.get('x-test-suite'), 'cartesia');
  assert.strictEqual(headers.get('x-stainless-retry-count'), '2');

  return 'PASS: withOptions applies per-client overrides';
};
