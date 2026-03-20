import assert from 'assert';
import Replicate from 'replicate';

export const run = async () => {
  const calls = [];

  const fetchMock = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      headers: new Headers(init.headers),
      body: init.body ? JSON.parse(init.body) : null,
    });

    return new Response(
      JSON.stringify({
        id: 'pred_123',
        status: 'succeeded',
        model: 'owner/model',
        version: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        input: { prompt: 'hello' },
        output: ['done'],
      }),
      {
        status: 201,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  const client = new Replicate({
    auth: 'r8_test_token',
    fetch: fetchMock,
    baseUrl: 'https://api.replicate.com/v1',
  });

  const prediction = await client.predictions.create({
    version: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    input: { prompt: 'hello' },
  });

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].method, 'POST');
  assert.ok(calls[0].url.endsWith('/predictions'));
  assert.strictEqual(calls[0].headers.get('authorization'), 'Bearer r8_test_token');
  assert.strictEqual(calls[0].body.version.length, 64);
  assert.strictEqual(calls[0].body.input.prompt, 'hello');

  assert.strictEqual(prediction.id, 'pred_123');
  assert.strictEqual(prediction.status, 'succeeded');
  assert.deepStrictEqual(prediction.output, ['done']);

  return 'PASS: predictions.create sends auth header and parses response';
};
