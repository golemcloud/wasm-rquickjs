import assert from 'assert';
import Together from 'together-ai';

export const run = () => {
  const fetchMock = async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  const client = new Together({
    apiKey: 'test-api-key',
    baseURL: 'https://api.together.xyz/v1',
    defaultQuery: { source: 'wasm-rquickjs' },
    fetch: fetchMock,
  });

  assert.ok(client.chat);
  assert.ok(client.completions);
  assert.ok(client.embeddings);
  assert.ok(client.images);
  assert.ok(client.audio);
  assert.ok(client.files);
  assert.ok(client.fineTuning);
  assert.ok(client.models);
  assert.ok(client.endpoints);
  assert.ok(client.rerank);
  assert.ok(client.batches);
  assert.ok(client.evals);
  assert.ok(client.codeInterpreter);
  assert.ok(client.videos);
  assert.ok(client.beta);

  const url = new URL(client.buildURL('/models', { limit: '1' }));
  assert.strictEqual(url.origin, 'https://api.together.xyz');
  assert.strictEqual(url.pathname, '/v1/models');
  assert.strictEqual(url.searchParams.get('source'), 'wasm-rquickjs');
  assert.strictEqual(url.searchParams.get('limit'), '1');

  return 'PASS: Together client constructs and exposes core resources';
};
