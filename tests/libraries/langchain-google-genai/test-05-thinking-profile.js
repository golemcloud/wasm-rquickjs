import assert from 'assert';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export const run = () => {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    maxRetries: 0,
    thinkingConfig: {
      includeThoughts: true,
      thinkingBudget: 128,
      thinkingLevel: 'LOW',
    },
  });

  assert.ok(llm.profile, 'Expected profile metadata for Gemini 2.5');
  assert.strictEqual(llm.profile.reasoningOutput, true);
  assert.strictEqual(llm.profile.toolCalling, true);

  return 'PASS: Gemini 2.5 thinking config and reasoning profile metadata are available offline';
};
