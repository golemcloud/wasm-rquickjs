import assert from 'assert';
import { HTTPClient, Mistral } from '@mistralai/mistralai';

export const run = async () => {
  const calls = [];

  const httpClient = new HTTPClient({
    fetcher: async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      calls.push({
        url: request.url,
        method: request.method,
        authorization: request.headers.get('authorization'),
        contentType: request.headers.get('content-type'),
        body: await request.text(),
      });

      const mockedResponse = {
        id: 'cmpl_123',
        object: 'chat.completion',
        created: 1700000000,
        model: 'mistral-small-latest',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Mock completion',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 3,
          total_tokens: 15,
        },
      };

      return new Response(JSON.stringify(mockedResponse), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      });
    },
  });

  const client = new Mistral({ apiKey: 'test-api-key', httpClient });

  const completion = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: 'Say hello' }],
    maxTokens: 64,
    safePrompt: true,
  });

  assert.strictEqual(completion.id, 'cmpl_123');
  assert.strictEqual(completion.choices[0].message.content, 'Mock completion');
  assert.strictEqual(completion.usage.totalTokens, 15);

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].url, 'https://api.mistral.ai/v1/chat/completions');
  assert.strictEqual(calls[0].method, 'POST');
  assert.strictEqual(calls[0].authorization, 'Bearer test-api-key');
  assert.strictEqual(calls[0].contentType, 'application/json');

  const requestBody = JSON.parse(calls[0].body);
  assert.strictEqual(requestBody.model, 'mistral-small-latest');
  assert.strictEqual(requestBody.stream, false);
  assert.strictEqual(requestBody.max_tokens, 64);
  assert.strictEqual(requestBody.safe_prompt, true);
  assert.deepStrictEqual(requestBody.messages, [{ role: 'user', content: 'Say hello' }]);

  return 'PASS: chat.complete() serializes request and parses mocked response';
};
