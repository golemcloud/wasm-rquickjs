import assert from 'assert';
import OpenAI from 'openai';

export const run = async () => {
  const calls = [];
  const fetchMock = async (url, init = {}) => {
    const requestUrl = typeof url === 'string' ? url : url.url;
    const authorization =
      typeof init.headers?.get === 'function'
        ? init.headers.get('authorization')
        : init.headers?.authorization;

    calls.push({
      url: requestUrl,
      method: init.method,
      authorization,
    });

    return new Response(JSON.stringify({
      object: 'list',
      data: [
        {
          id: 'gpt-test-model',
          object: 'model',
          created: 0,
          owned_by: 'openai',
        },
      ],
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req_mock_api',
      },
    });
  };

  const client = new OpenAI({
    apiKey: 'test-api-key',
    baseURL: 'https://example.com/v1',
    fetch: fetchMock,
  });

  const { data, request_id } = await client.models.list().withResponse();

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].method, 'GET');
  assert.ok(calls[0].url.endsWith('/models'));
  assert.strictEqual(calls[0].authorization, 'Bearer test-api-key');
  assert.strictEqual(request_id, 'req_mock_api');
  assert.strictEqual(data.data[0].id, 'gpt-test-model');

  return 'PASS: models.list() works with mocked fetch and exposes request metadata';
};
