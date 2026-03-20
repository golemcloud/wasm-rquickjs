import assert from 'assert';
import Turbopuffer from '@turbopuffer/turbopuffer';

export const run = async () => {
  const requests = [];

  const fetchMock = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    return new Response(
      JSON.stringify({
        namespaces: [{ id: 'vec-alpha' }],
        next_cursor: '',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  const client = new Turbopuffer({
    apiKey: 'tpuf_test_key',
    baseURL: 'http://localhost:18080',
    region: null,
    defaultHeaders: { 'x-test-suite': 'offline' },
    defaultQuery: { trace: 'yes' },
    fetch: fetchMock,
  });

  const page = await client.namespaces({ prefix: 'vec' });
  assert.strictEqual(page.namespaces.length, 1);
  assert.strictEqual(page.namespaces[0].id, 'vec-alpha');

  assert.strictEqual(requests.length, 1);
  assert.ok(requests[0].url.includes('/v1/namespaces'));
  assert.ok(requests[0].url.includes('trace=yes'));
  assert.ok(requests[0].url.includes('prefix=vec'));

  const headers = new Headers(requests[0].init.headers);
  assert.strictEqual(headers.get('authorization'), 'Bearer tpuf_test_key');
  assert.strictEqual(headers.get('x-test-suite'), 'offline');

  return 'PASS: Request options merge default headers/query and emit authenticated API calls';
};
