import assert from 'assert';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const toText = (content) => {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (typeof part?.text === 'string') return part.text;
      return '';
    })
    .join('');
};

export const run = async () => {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: 'test-key',
    model: 'gemini-2.0-flash',
    maxRetries: 0,
    temperature: 0,
    apiVersion: 'v1beta',
    baseUrl: 'http://localhost:18080',
    customHeaders: {
      'x-extra-header': 'present',
    },
  });

  const response = await llm.invoke('CHECK_HEADERS');
  const text = toText(response.content);

  assert.strictEqual(text, 'HEADERS_OK');
  return 'PASS: ChatGoogleGenerativeAI performs real HTTP call to mock server with expected headers';
};
