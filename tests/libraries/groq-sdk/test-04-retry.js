import assert from 'assert';
import Groq from 'groq-sdk';

export const run = async () => {
  let attempts = 0;

  const fetchMock = async () => {
    attempts += 1;

    if (attempts === 1) {
      return new Response(
        JSON.stringify({ error: { message: 'rate limited' } }),
        {
          status: 429,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

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
    maxRetries: 1,
  });

  const result = await client.models.list();

  assert.strictEqual(attempts, 2);
  assert.strictEqual(result.data.length, 1);

  return 'PASS: Groq retries once after HTTP 429 and then succeeds';
};
