import assert from 'assert';
import Instructor from '@instructor-ai/instructor';
import OpenAI from 'openai';

export const run = async () => {
  const client = Instructor({
    client: new OpenAI({
      apiKey: 'test-key',
      baseURL: 'http://localhost:18080/v1',
    }),
    mode: 'TOOLS',
  });

  const result = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'INTEGRATION_PASSTHROUGH: return raw completion' }],
  });

  assert.strictEqual(result.object, 'chat.completion');
  assert.strictEqual(result.choices[0].message.content, 'PASSTHROUGH_OK');

  return 'PASS: calls without response_model remain pass-through over HTTP transport';
};
