import assert from 'assert';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export const run = async () => {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: 'test-key',
    model: 'gemini-2.0-flash',
    maxRetries: 0,
    temperature: 0,
    apiVersion: 'v1beta',
    baseUrl: 'http://localhost:18080',
  });

  let caught = false;
  try {
    await llm.invoke('TRIGGER_HTTP_ERROR');
  } catch (error) {
    caught = true;
    const message = String(error?.message || error);
    assert.match(message, /429|RESOURCE_EXHAUSTED|rate limit/i);
  }

  assert.ok(caught, 'Expected ChatGoogleGenerativeAI.invoke to throw on mock HTTP error');

  return 'PASS: ChatGoogleGenerativeAI surfaces Google API HTTP errors';
};
