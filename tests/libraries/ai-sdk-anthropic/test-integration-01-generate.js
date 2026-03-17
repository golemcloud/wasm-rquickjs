import assert from 'assert';
import { createAnthropic } from '@ai-sdk/anthropic';

export const run = async () => {
  const provider = createAnthropic({
    apiKey: 'test-key',
    baseURL: 'http://localhost:18080/v1',
  });

  const model = provider('claude-3-haiku-20240307');
  const result = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'PING' }] }],
  });

  assert.strictEqual(result.content[0].type, 'text');
  assert.strictEqual(result.content[0].text, 'MOCK_OK:PING');

  return 'PASS: doGenerate performs an HTTP request against the mock Anthropic endpoint';
};
