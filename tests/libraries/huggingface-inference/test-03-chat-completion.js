import assert from 'assert';
import { chatCompletion } from '@huggingface/inference';

export const run = async () => {
  const calls = [];

  const mockFetch = async (url, init) => {
    calls.push({
      url: String(url),
      method: init.method,
      headers: new Headers(init.headers),
      body: JSON.parse(init.body),
    });

    return new Response(
      JSON.stringify({
        id: 'chatcmpl-test-1',
        object: 'chat.completion',
        created: 1,
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Hello from mock' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 3,
          completion_tokens: 3,
          total_tokens: 6,
        },
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  const output = await chatCompletion(
    {
      accessToken: 'hf_mock_token',
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Say hello' }],
      temperature: 0,
    },
    {
      fetch: mockFetch,
      billTo: 'org-compat-tests',
    },
  );

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].method, 'POST');
  assert.strictEqual(calls[0].url, 'https://router.huggingface.co/v1/chat/completions');
  assert.strictEqual(calls[0].headers.get('authorization'), 'Bearer hf_mock_token');
  assert.strictEqual(calls[0].headers.get('x-hf-bill-to'), 'org-compat-tests');
  assert.strictEqual(calls[0].body.model, 'meta-llama/Llama-3.3-70B-Instruct');
  assert.strictEqual(calls[0].body.messages[0].content, 'Say hello');
  assert.strictEqual(output.choices[0].message.content, 'Hello from mock');

  return 'PASS: chatCompletion sends routed request and parses completion output';
};
