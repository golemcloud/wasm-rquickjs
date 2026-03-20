import assert from 'assert';
import Turbopuffer from '@turbopuffer/turbopuffer';

export const run = async () => {
  const fetchMock = async (url) => {
    const path = new URL(url).pathname;

    if (path.endsWith('/schema')) {
      return new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (path.endsWith('/query')) {
      return new Response(JSON.stringify({ error: 'server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'unexpected route' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  };

  const client = new Turbopuffer({
    apiKey: 'tpuf_test_key',
    baseURL: 'http://localhost:18080',
    region: null,
    fetch: fetchMock,
    maxRetries: 0,
  });

  const ns = client.namespace('missing-ns');
  const exists = await ns.exists();
  assert.strictEqual(exists, false);

  await assert.rejects(
    () => ns.query({ top_k: 1 }),
    (error) => error instanceof Turbopuffer.InternalServerError,
  );

  return 'PASS: exists() maps 404 to false and server failures map to API error subclasses';
};
