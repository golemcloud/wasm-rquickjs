import assert from 'assert';
import Groq from 'groq-sdk';

export const run = async () => {
  const calls = [];

  const fetchMock = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      headers: new Headers(init.headers),
    });

    return new Response(
      JSON.stringify({
        object: 'list',
        data: [{ id: 'llama3-8b-8192', object: 'model' }],
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  const client = new Groq({
    apiKey: 'test-api-key',
    fetch: fetchMock,
  });

  const result = await client.models.list();

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].method, 'GET');
  assert.ok(calls[0].url.endsWith('/openai/v1/models'));
  assert.strictEqual(calls[0].headers.get('authorization'), 'Bearer test-api-key');
  assert.strictEqual(result.object, 'list');
  assert.strictEqual(result.data[0].id, 'llama3-8b-8192');

  return 'PASS: models.list uses fetch with auth headers and parses JSON';
};
