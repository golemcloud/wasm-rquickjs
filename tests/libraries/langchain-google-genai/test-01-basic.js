import assert from 'assert';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export const run = () => {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: 'test-key',
    model: 'gemini-2.0-flash',
    temperature: 0,
    maxRetries: 0,
  });

  assert.strictEqual(llm._llmType(), 'googlegenerativeai');
  assert.ok(llm.profile, 'Expected model profile to be available');
  assert.strictEqual(typeof llm.profile.maxInputTokens, 'number');
  assert.strictEqual(typeof llm.profile.structuredOutput, 'boolean');

  return 'PASS: ChatGoogleGenerativeAI constructs and exposes model profile metadata';
};
