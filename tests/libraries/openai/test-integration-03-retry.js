import assert from 'assert';
import OpenAI from 'openai';

const BASE = 'http://localhost:18080/v1';

export const run = async () => {
  const client = new OpenAI({
    apiKey: 'test-openai-key',
    baseURL: BASE,
    maxRetries: 1,
  });

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'TRIGGER_RETRY then succeed' }],
    max_tokens: 16,
  });

  assert.strictEqual(completion.choices[0].message.content, 'MOCK_CHAT_OK');
  return 'PASS: SDK retries a 429 response and succeeds against HTTP mock server';
};
