import assert from 'assert';
import { ChatOpenAI } from '@langchain/openai';

export const run = async () => {
  const llm = new ChatOpenAI({
    apiKey: 'test-key',
    model: 'gpt-4o-mini',
    maxRetries: 0,
  });

  const shortCount = await llm.getNumTokens('hello world');
  const longCount = await llm.getNumTokens('hello world '.repeat(30));

  assert.ok(shortCount > 0, `Expected shortCount > 0, got ${shortCount}`);
  assert.ok(longCount > shortCount, `Expected longCount > shortCount, got ${longCount} <= ${shortCount}`);

  return 'PASS: getNumTokens performs offline token counting';
};
