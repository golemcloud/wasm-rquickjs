import assert from 'assert';
import Groq from 'groq-sdk';

export const run = () => {
  const fetchMock = async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  const client = new Groq({
    apiKey: 'test-api-key',
    baseURL: 'https://api.groq.com',
    defaultQuery: { source: 'wasm-rquickjs' },
    fetch: fetchMock,
  });

  assert.ok(client.chat);
  assert.ok(client.completions);
  assert.ok(client.audio);
  assert.ok(client.embeddings);
  assert.ok(client.models);
  assert.ok(client.files);
  assert.ok(client.batches);

  const url = new URL(client.buildURL('/openai/v1/models', { limit: '1' }));
  assert.strictEqual(url.origin, 'https://api.groq.com');
  assert.strictEqual(url.pathname, '/openai/v1/models');
  assert.strictEqual(url.searchParams.get('source'), 'wasm-rquickjs');
  assert.strictEqual(url.searchParams.get('limit'), '1');

  return 'PASS: Groq client constructs and exposes core resources';
};
