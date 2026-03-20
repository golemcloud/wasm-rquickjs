import assert from 'assert';
import 'lumaai/shims/web';
import LumaAI from 'lumaai';

export const run = async () => {
  const requests = [];

  const client = new LumaAI({
    authToken: 'test-token',
    baseURL: 'http://localhost:18080/dream-machine/v1',
    fetch: async (url, init = {}) => {
      const requestUrl = new URL(String(url));
      requests.push(`${init.method ?? 'GET'} ${requestUrl.pathname}${requestUrl.search}`);

      if (requestUrl.pathname.endsWith('/generations')) {
        assert.strictEqual(requestUrl.searchParams.get('limit'), '2');
        assert.strictEqual(requestUrl.searchParams.get('offset'), '1');

        return new Response(
          JSON.stringify({
            generations: [
              { id: 'gen-complete-1', state: 'completed', generation_type: 'image' },
              { id: 'gen-complete-2', state: 'completed', generation_type: 'image' },
            ],
            count: 2,
            has_more: false,
            limit: 2,
            offset: 1,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        );
      }

      if (requestUrl.pathname.endsWith('/generations/gen-complete-1')) {
        return new Response(
          JSON.stringify({
            id: 'gen-complete-1',
            state: 'completed',
            generation_type: 'image',
            assets: { image: 'https://example.com/result-1.png' },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({ message: 'Not Found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const list = await client.generations.list({ limit: 2, offset: 1 });
  const item = await client.generations.get('gen-complete-1');

  assert.strictEqual(list.generations.length, 2);
  assert.strictEqual(list.count, 2);
  assert.strictEqual(list.has_more, false);
  assert.strictEqual(item.id, 'gen-complete-1');
  assert.strictEqual(item.state, 'completed');
  assert.ok(requests.includes('GET /dream-machine/v1/generations?limit=2&offset=1'));
  assert.ok(requests.includes('GET /dream-machine/v1/generations/gen-complete-1'));

  return 'PASS: generations.list/get handle query parameters and parse responses';
};
