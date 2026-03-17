import assert from 'assert';
import { createAnthropic } from '@ai-sdk/anthropic';

export const run = async () => {
  const provider = createAnthropic({
    apiKey: 'test-key',
    baseURL: 'http://localhost:18080/v1',
    headers: {
      'x-extra-header': 'present',
    },
  });

  const model = provider('claude-3-haiku-20240307');
  const result = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'CHECK_HEADERS' }] }],
  });

  assert.strictEqual(result.content[0].type, 'text');
  assert.strictEqual(result.content[0].text, 'HEADERS_OK');

  return 'PASS: provider sends Anthropic auth/version headers and custom headers over HTTP';
};
