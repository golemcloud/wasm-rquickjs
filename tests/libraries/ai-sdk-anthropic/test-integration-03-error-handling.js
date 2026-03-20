import assert from 'assert';
import { createAnthropic } from '@ai-sdk/anthropic';

export const run = async () => {
  const provider = createAnthropic({
    apiKey: 'test-key',
    baseURL: 'http://localhost:18080/v1',
  });

  const model = provider('claude-3-haiku-20240307');

  await assert.rejects(
    () =>
      model.doGenerate({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'TRIGGER_ANTHROPIC_ERROR' }] }],
      }),
    /invalid x-api-key/i,
  );

  return 'PASS: doGenerate surfaces Anthropic API error responses from the HTTP transport';
};
