import assert from 'assert';
import Together from 'together-ai';

export const run = async () => {
  let attempts = 0;

  const fetchMock = async () => {
    attempts += 1;

    if (attempts === 1) {
      return new Response(
        JSON.stringify({ error: { type: 'rate_limit', message: 'rate limited' } }),
        {
          status: 429,
          headers: {
            'content-type': 'application/json',
            'retry-after': '0',
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        object: 'list',
        data: [{ id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', object: 'model' }],
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  const client = new Together({
    apiKey: 'test-api-key',
    maxRetries: 1,
    fetch: fetchMock,
  });

  const result = await client.models.list();

  assert.strictEqual(attempts, 2);
  assert.strictEqual(result.object, 'list');
  assert.strictEqual(result.data.length, 1);

  return 'PASS: Retry flow succeeds after an initial 429 response';
};
