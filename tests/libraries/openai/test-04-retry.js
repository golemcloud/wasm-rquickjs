import assert from 'assert';
import OpenAI from 'openai';

export const run = async () => {
  let attempts = 0;

  const fetchMock = async () => {
    attempts += 1;

    if (attempts === 1) {
      return new Response(JSON.stringify({
        error: {
          message: 'rate limited',
          type: 'rate_limit_error',
        },
      }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after-ms': '1',
          'x-request-id': 'req_retry_1',
        },
      });
    }

    return new Response(JSON.stringify({
      object: 'list',
      data: [
        {
          id: 'gpt-retry-model',
          object: 'model',
          created: 0,
          owned_by: 'openai',
        },
      ],
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req_retry_2',
      },
    });
  };

  const client = new OpenAI({
    apiKey: 'test-api-key',
    baseURL: 'https://example.com/v1',
    maxRetries: 1,
    fetch: fetchMock,
  });

  const models = await client.models.list();

  assert.strictEqual(attempts, 2);
  assert.strictEqual(models.data[0].id, 'gpt-retry-model');

  return 'PASS: SDK retries once on 429 and succeeds on second attempt';
};
