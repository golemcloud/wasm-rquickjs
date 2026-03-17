import assert from 'assert';
import { ChatAnthropic } from '@langchain/anthropic';

export const run = () => {
  const model = new ChatAnthropic('claude-3-haiku-20240307', {
    apiKey: 'test-key',
    temperature: 0.3,
    maxTokens: 256,
    maxRetries: 0,
  });

  assert.strictEqual(model._llmType(), 'anthropic');
  assert.strictEqual(model.model, 'claude-3-haiku-20240307');
  assert.strictEqual(model.modelName, 'claude-3-haiku-20240307');

  const params = model.identifyingParams();
  assert.strictEqual(params.model_name, 'claude-3-haiku-20240307');
  assert.strictEqual(params.temperature, 0.3);
  assert.strictEqual(params.max_tokens, 256);
  assert.strictEqual(params.stream, false);

  assert.ok(model.profile && typeof model.profile === 'object');

  return 'PASS: ChatAnthropic constructs and exposes stable identifying parameters';
};
