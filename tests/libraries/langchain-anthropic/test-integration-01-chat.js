import assert from 'assert';
import { ChatAnthropic } from '@langchain/anthropic';

const asText = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : (typeof part?.text === 'string' ? part.text : '')))
      .join('');
  }
  return '';
};

export const run = async () => {
  const model = new ChatAnthropic({
    apiKey: 'test-key',
    model: 'claude-3-haiku-20240307',
    anthropicApiUrl: 'http://localhost:18080',
    maxRetries: 0,
  });

  const response = await model.invoke('PING');
  const text = asText(response.content);

  assert.strictEqual(text, 'MOCK_OK:PING');

  return 'PASS: ChatAnthropic invoke performs HTTP request against mock Anthropic endpoint';
};
