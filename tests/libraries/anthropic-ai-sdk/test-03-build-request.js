import assert from 'assert';
import Anthropic from '@anthropic-ai/sdk';

export const run = async () => {
  const client = new Anthropic({
    apiKey: 'test-anthropic-api-key',
    baseURL: 'https://example.com',
  });

  const { req, url, timeout } = await client.buildRequest({
    path: '/v1/messages',
    method: 'post',
    body: {
      model: 'claude-sonnet-4-5',
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Hello' }],
    },
    headers: {
      'x-custom-header': 'custom-value',
    },
  });

  assert.strictEqual(timeout, 600000);
  assert.strictEqual(url, 'https://example.com/v1/messages');
  assert.strictEqual(req.method, 'post');
  assert.strictEqual(req.headers.get('x-api-key'), 'test-anthropic-api-key');
  assert.strictEqual(req.headers.get('anthropic-version'), '2023-06-01');
  assert.strictEqual(req.headers.get('x-custom-header'), 'custom-value');
  assert.strictEqual(req.headers.get('content-type'), 'application/json');

  const body = JSON.parse(req.body);
  assert.strictEqual(body.model, 'claude-sonnet-4-5');
  assert.strictEqual(body.max_tokens, 16);
  assert.strictEqual(body.messages[0].role, 'user');

  return 'PASS: buildRequest creates expected URL, headers, and JSON payload';
};
