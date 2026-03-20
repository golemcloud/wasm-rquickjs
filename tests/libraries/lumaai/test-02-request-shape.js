import assert from 'assert';
import 'lumaai/shims/web';
import LumaAI from 'lumaai';

export const run = async () => {
  let captured;

  const client = new LumaAI({
    authToken: 'test-token',
    baseURL: 'http://localhost:18080/dream-machine/v1',
    fetch: async (url, init = {}) => {
      captured = {
        url: String(url),
        method: init.method ?? 'GET',
        headers: new Headers(init.headers),
      };

      return new Response(JSON.stringify({ message: 'pong' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const response = await client.ping.check();

  assert.strictEqual(response.message, 'pong');
  assert.ok(captured.url.endsWith('/dream-machine/v1/ping'));
  assert.strictEqual(captured.method, 'GET');
  assert.strictEqual(captured.headers.get('authorization'), 'Bearer test-token');

  return 'PASS: ping.check sends GET /ping with bearer auth';
};
