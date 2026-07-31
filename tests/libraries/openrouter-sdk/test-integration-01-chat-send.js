import assert from 'node:assert';
import { OpenRouter } from '@openrouter/sdk';

const SERVER_URL = 'http://localhost:18083/api/v1';

export const run = async () => {
  const client = new OpenRouter({ apiKey: 'sk-test' });
  const result = await client.chat.send({
    chatRequest: {
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'openai/gpt-test',
    },
  }, {
    serverURL: SERVER_URL,
    retries: { strategy: 'none' },
  });

  assert.strictEqual(result.choices[0].message.content, 'offline reply');
  assert.strictEqual(result.choices[0].finishReason, 'stop');

  return 'PASS: OpenRouter sends and parses a chat request through the HTTP stack';
};
