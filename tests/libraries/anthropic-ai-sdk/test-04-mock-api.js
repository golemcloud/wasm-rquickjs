import assert from 'assert';
import Anthropic from '@anthropic-ai/sdk';

export const run = async () => {
  const calls = [];

  const fetchMock = async (url, init = {}) => {
    const requestUrl = typeof url === 'string' ? url : url.url;
    const apiKey = typeof init.headers?.get === 'function'
      ? init.headers.get('x-api-key')
      : init.headers?.['x-api-key'];

    calls.push({
      url: requestUrl,
      method: init.method,
      apiKey,
    });

    return new Response(JSON.stringify({
      id: 'msg_test_1',
      type: 'message',
      role: 'assistant',
      model: 'claude-sonnet-4-5',
      content: [{ type: 'text', text: 'Hello from mock' }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 3, output_tokens: 4 },
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'request-id': 'req_mock_1',
      },
    });
  };

  const client = new Anthropic({
    apiKey: 'test-anthropic-api-key',
    baseURL: 'https://example.com',
    fetch: fetchMock,
  });

  const response = await client.messages
    .create({
      model: 'claude-sonnet-4-5',
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Hi!' }],
    })
    .withResponse();

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].method, 'POST');
  assert.ok(calls[0].url.endsWith('/v1/messages'));
  assert.strictEqual(calls[0].apiKey, 'test-anthropic-api-key');
  assert.strictEqual(response.request_id, 'req_mock_1');
  assert.strictEqual(response.data.content[0].text, 'Hello from mock');

  return 'PASS: messages.create works with mocked fetch and response metadata';
};
