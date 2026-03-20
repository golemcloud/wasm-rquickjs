import assert from 'assert';
import { ChatOpenAICompletions } from '@langchain/openai';

export const run = async () => {
  const llm = new ChatOpenAICompletions({
    apiKey: 'test-key',
    model: 'gpt-4o-mini',
    maxRetries: 0,
    configuration: {
      baseURL: 'http://localhost:18080/v1',
    },
  });

  try {
    await llm.invoke('TRIGGER_RATE_LIMIT');
    throw new Error('Expected invoke to fail for 429 response');
  } catch (e) {
    const code = e?.lc_error_code;
    const msg = String(e?.message ?? e);
    assert.ok(code === 'MODEL_RATE_LIMIT' || msg.includes('Rate limit'), `Unexpected error: ${msg}`);
  }

  return 'PASS: OpenAI client errors from HTTP transport are surfaced with LangChain error metadata';
};
