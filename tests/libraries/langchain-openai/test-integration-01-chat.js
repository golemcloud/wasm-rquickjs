import assert from 'assert';
import { ChatOpenAICompletions } from '@langchain/openai';

export const run = async () => {
  const llm = new ChatOpenAICompletions({
    apiKey: 'test-key',
    model: 'gpt-4o-mini',
    temperature: 0,
    maxRetries: 0,
    configuration: {
      baseURL: 'http://localhost:18080/v1',
      defaultHeaders: {
        'x-extra-header': 'present',
      },
    },
  });

  const response = await llm.invoke('CHECK_HEADERS');
  const text = typeof response.content === 'string'
    ? response.content
    : response.content.map((part) => (typeof part === 'string' ? part : part?.text ?? '')).join('');

  assert.strictEqual(text, 'HEADERS_OK');

  return 'PASS: ChatOpenAICompletions performs real HTTP call to mock server with expected headers';
};
