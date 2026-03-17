import assert from 'node:assert';
import { OpenAI } from '@llamaindex/openai';

export const run = async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  assert.ok(apiKey, 'OPENAI_API_KEY is required for live test');

  const llm = new OpenAI({
    apiKey,
    model: 'gpt-4o-mini',
    temperature: 0,
    maxTokens: 10,
    maxRetries: 1,
  });

  const response = await llm.chat({
    messages: [{ role: 'user', content: 'Reply with exactly: HELLO' }],
  });

  const text = String(response.message?.content || '').trim();
  assert.strictEqual(text, 'HELLO');
  return 'PASS: Live OpenAI chat via @llamaindex/openai returns expected output';
};
