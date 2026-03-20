import assert from 'assert';
import { ChatOpenAI } from '@langchain/openai';

export const run = () => {
  const llm = new ChatOpenAI({
    apiKey: 'test-key',
    model: 'gpt-4o-mini',
    temperature: 0.25,
    topP: 0.9,
    maxTokens: 64,
    maxRetries: 0,
  });

  const invocation = llm.invocationParams({ stop: ['DONE'] });

  assert.strictEqual(invocation.model, 'gpt-4o-mini');
  assert.strictEqual(invocation.temperature, 0.25);
  assert.strictEqual(invocation.top_p, 0.9);
  assert.ok(invocation.max_tokens === 64 || invocation.max_completion_tokens === 64);
  assert.deepStrictEqual(invocation.stop, ['DONE']);

  return 'PASS: invocationParams merges constructor and call options correctly';
};
