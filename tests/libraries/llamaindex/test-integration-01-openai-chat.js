import assert from 'node:assert';
import { OpenAI } from '@llamaindex/openai';

const BASE_URL = 'http://localhost:18080/v1';

export const run = async () => {
  const llm = new OpenAI({
    apiKey: 'test-key',
    baseURL: BASE_URL,
    model: 'gpt-4o-mini',
    maxRetries: 0,
  });

  const response = await llm.chat({
    messages: [{ role: 'user', content: 'Return the word MOCK_OK' }],
  });

  assert.strictEqual(String(response.message?.content).trim(), 'MOCK_OK');
  return 'PASS: OpenAI chat() works against local mock server';
};
