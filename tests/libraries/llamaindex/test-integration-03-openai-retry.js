import assert from 'node:assert';
import { OpenAI } from '@llamaindex/openai';

const BASE_URL = 'http://localhost:18080/v1';

export const run = async () => {
  const llm = new OpenAI({
    apiKey: 'test-key',
    baseURL: BASE_URL,
    model: 'gpt-4o-mini',
    maxRetries: 1,
  });

  const response = await llm.chat({
    messages: [{ role: 'user', content: 'TRIGGER_RETRY_FLOW' }],
  });

  assert.strictEqual(String(response.message?.content).trim(), 'RECOVERED');
  return 'PASS: OpenAI retry behavior recovers from mock 429 response';
};
