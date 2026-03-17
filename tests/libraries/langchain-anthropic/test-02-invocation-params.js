import assert from 'assert';
import { ChatAnthropic } from '@langchain/anthropic';

export const run = () => {
  const model = new ChatAnthropic({
    apiKey: 'test-key',
    model: 'claude-3-haiku-20240307',
    temperature: 0,
    topK: 4,
    topP: 0.8,
    stopSequences: ['DONE'],
  });

  const params = model.invocationParams({
    stop: ['STOP_NOW'],
    tool_choice: 'tool_name',
  });

  assert.strictEqual(params.model, 'claude-3-haiku-20240307');
  assert.strictEqual(params.temperature, 0);
  assert.strictEqual(params.top_k, 4);
  assert.strictEqual(params.top_p, 0.8);
  assert.deepStrictEqual(params.stop_sequences, ['STOP_NOW']);
  assert.deepStrictEqual(params.tool_choice, { type: 'tool', name: 'tool_name' });
  assert.ok(typeof params.max_tokens === 'number' && params.max_tokens > 0);

  const thinkingModel = new ChatAnthropic({
    apiKey: 'test-key',
    model: 'claude-3-haiku-20240307',
    thinking: { type: 'enabled', budget_tokens: 512 },
    topK: 1,
  });

  assert.throws(
    () => thinkingModel.invocationParams({}),
    /topK is not supported when thinking is enabled/
  );

  return 'PASS: invocationParams maps options correctly and enforces thinking constraints';
};
