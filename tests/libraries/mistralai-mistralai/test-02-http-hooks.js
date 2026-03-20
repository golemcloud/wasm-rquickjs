import assert from 'assert';
import { HTTPClient } from '@mistralai/mistralai';

export const run = async () => {
  const events = [];

  const httpClient = new HTTPClient({
    fetcher: async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      events.push({
        stage: 'fetcher',
        method: request.method,
        url: request.url,
        marker: request.headers.get('x-test-marker'),
      });

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-response-hook': 'present',
        },
      });
    },
  });

  httpClient.addHook('beforeRequest', (req) => {
    req.headers.set('x-test-marker', 'hooked');
    events.push({ stage: 'beforeRequest' });
  });

  httpClient.addHook('response', (res, req) => {
    events.push({
      stage: 'response',
      status: res.status,
      marker: req.headers.get('x-test-marker'),
      responseHeader: res.headers.get('x-response-hook'),
    });
  });

  const response = await httpClient.request(new Request('https://example.com/unit-test', { method: 'POST' }));
  const payload = await response.json();

  assert.deepStrictEqual(payload, { ok: true });
  assert.strictEqual(events[0].stage, 'beforeRequest');
  assert.strictEqual(events[1].stage, 'fetcher');
  assert.strictEqual(events[1].method, 'POST');
  assert.strictEqual(events[1].marker, 'hooked');
  assert.strictEqual(events[2].stage, 'response');
  assert.strictEqual(events[2].status, 200);
  assert.strictEqual(events[2].marker, 'hooked');
  assert.strictEqual(events[2].responseHeader, 'present');

  return 'PASS: HTTPClient beforeRequest and response hooks execute in order';
};
