import assert from 'assert';
import { withMiddleware, withProxy } from '@fal-ai/client';

export const run = async () => {
  const request = {
    url: 'https://fal.run/fal-ai/test-model',
    method: 'POST',
    headers: {
      'x-initial': '1',
    },
  };

  const pipeline = withMiddleware(
    async (config) => ({
      ...config,
      headers: {
        ...(config.headers ?? {}),
        'x-first': 'yes',
      },
    }),
    async (config) => ({
      ...config,
      headers: {
        ...(config.headers ?? {}),
        'x-second': 'yes',
      },
    }),
  );

  const transformed = await pipeline(request);
  assert.deepStrictEqual(transformed.headers, {
    'x-initial': '1',
    'x-first': 'yes',
    'x-second': 'yes',
  });

  const previousWindow = globalThis.window;
  try {
    globalThis.window = {};
    const proxyMiddleware = withProxy({ targetUrl: 'http://localhost:18080/proxy' });
    const proxied = await proxyMiddleware(request);

    assert.strictEqual(proxied.url, 'http://localhost:18080/proxy');
    assert.strictEqual(proxied.headers['x-fal-target-url'], request.url);
  } finally {
    if (typeof previousWindow === 'undefined') {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  }

  return 'PASS: middleware composition and proxy rewriting work correctly';
};
