import assert from 'assert';
import Cartesia from '@cartesia/cartesia-js';

export const run = async () => {
  const client = new Cartesia({
    token: 'test-token',
    baseURL: 'http://localhost:18080',
  });

  const built = await client.buildRequest(
    {
      method: 'get',
      path: '/voices',
      query: { limit: 1, q: 'Ada' },
    },
    { retryCount: 3 },
  );

  const headers = new Headers(built.req.headers);
  assert.strictEqual(built.req.method, 'get');
  assert.strictEqual(built.url, 'http://localhost:18080/voices?limit=1&q=Ada');
  assert.strictEqual(headers.get('authorization'), 'Bearer test-token');
  assert.strictEqual(headers.get('cartesia-version'), '2025-11-04');
  assert.strictEqual(headers.get('x-stainless-retry-count'), '3');

  return 'PASS: buildRequest includes token auth and required headers';
};
