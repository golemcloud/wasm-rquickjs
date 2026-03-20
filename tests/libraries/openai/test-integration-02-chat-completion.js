import assert from 'assert';
import OpenAI from 'openai';

const BASE = 'http://localhost:18080/v1';

export const run = async () => {
  const client = new OpenAI({
    apiKey: 'test-openai-key',
    baseURL: BASE,
  });

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Return deterministic content' }],
    max_tokens: 16,
  });

  assert.strictEqual(completion.object, 'chat.completion');
  assert.strictEqual(completion.choices[0].message.content, 'MOCK_CHAT_OK');
  assert.ok(completion._request_id, 'Expected request id field');

  return 'PASS: chat.completions.create() parses JSON response from HTTP mock server';
};
