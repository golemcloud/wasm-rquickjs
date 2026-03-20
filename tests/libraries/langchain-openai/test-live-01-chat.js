import assert from 'assert';
import { ChatOpenAICompletions } from '@langchain/openai';

export const run = async () => {
  const apiKey = process.env.OPENAI_API_KEY || 'missing-openai-api-key';

  const llm = new ChatOpenAICompletions({
    apiKey,
    model: 'gpt-4o-mini',
    temperature: 0,
    maxRetries: 0,
  });

  const response = await llm.invoke('Reply with exactly LANGCHAIN_OPENAI_LIVE_OK');
  const text = typeof response.content === 'string'
    ? response.content
    : response.content.map((part) => (typeof part === 'string' ? part : part?.text ?? '')).join('');

  assert.ok(text.includes('LANGCHAIN_OPENAI_LIVE_OK'), `Unexpected completion content: ${text}`);

  return 'PASS: live chat completion returns expected marker text';
};
