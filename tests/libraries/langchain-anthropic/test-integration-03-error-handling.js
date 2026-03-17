import assert from 'assert';
import { ChatAnthropic } from '@langchain/anthropic';

export const run = async () => {
  const model = new ChatAnthropic({
    apiKey: 'test-key',
    model: 'claude-3-haiku-20240307',
    anthropicApiUrl: 'http://localhost:18080',
    maxRetries: 0,
  });

  await assert.rejects(
    () => model.invoke('TRIGGER_ANTHROPIC_ERROR'),
    (error) => {
      const msg = String(error?.message ?? error);
      return msg.includes('invalid x-api-key');
    }
  );

  return 'PASS: Anthropic API errors are propagated with useful message text';
};
