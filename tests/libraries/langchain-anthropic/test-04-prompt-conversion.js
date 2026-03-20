import assert from 'assert';
import { ChatAnthropic, convertPromptToAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptValue } from '@langchain/core/prompt_values';
import { z } from 'zod';

export const run = () => {
  const prompt = new ChatPromptValue([
    new SystemMessage('You are concise.'),
    new HumanMessage('Summarize this text.'),
  ]);

  const converted = convertPromptToAnthropic(prompt);
  assert.strictEqual(converted.system, 'You are concise.');
  assert.ok(Array.isArray(converted.messages));
  assert.strictEqual(converted.messages.length, 1);
  assert.strictEqual(converted.messages[0].role, 'user');
  assert.strictEqual(converted.messages[0].content, 'Summarize this text.');

  const model = new ChatAnthropic({
    apiKey: 'test-key',
    model: 'claude-3-haiku-20240307',
  });

  const runnable = model.withStructuredOutput(
    z.object({ answer: z.string() }),
    { name: 'answer_schema' }
  );

  assert.strictEqual(typeof runnable.invoke, 'function');

  return 'PASS: prompt conversion and structured-output runnable creation work offline';
};
