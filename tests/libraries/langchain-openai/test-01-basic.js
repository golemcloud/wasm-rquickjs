import assert from 'assert';
import { ChatOpenAI } from '@langchain/openai';

export const run = () => {
  const llm = new ChatOpenAI({
    apiKey: 'test-key',
    model: 'gpt-4o-mini',
    temperature: 0,
    maxRetries: 0,
  });

  assert.strictEqual(llm._llmType(), 'openai');

  const params = llm.identifyingParams();
  assert.strictEqual(params.model_name, 'gpt-4o-mini');
  assert.strictEqual(params.temperature, 0);

  assert.ok(llm.profile, 'Expected model profile to be available');
  assert.strictEqual(typeof llm.profile.maxInputTokens, 'number');

  return 'PASS: ChatOpenAI constructs and exposes identifying/profile metadata';
};
