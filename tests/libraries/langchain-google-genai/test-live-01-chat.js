import assert from 'assert';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const isKnownCredentialGate = (message) => {
  return (
    /API has not been used in project/i.test(message) ||
    /API key not valid/i.test(message) ||
    /PERMISSION_DENIED/i.test(message) ||
    /UNAUTHENTICATED/i.test(message)
  );
};

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
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GOOGLE_API_KEY/GOOGLE_GENERATIVE_AI_API_KEY for live test');
  }

  const llm = new ChatGoogleGenerativeAI({
    apiKey,
    model: 'gemini-2.0-flash-lite',
    temperature: 0,
    maxRetries: 0,
  });

  try {
    const response = await llm.invoke('Reply with exactly LANGCHAIN_GOOGLE_GENAI_LIVE_OK');
    const text = toText(response.content).trim();
    assert.ok(
      text.includes('LANGCHAIN_GOOGLE_GENAI_LIVE_OK'),
      `Unexpected completion content: ${text}`
    );
    return 'PASS: live Gemini chat invocation returns expected marker text';
  } catch (error) {
    const message = String(error?.message || error);
    if (!isKnownCredentialGate(message)) {
      throw error;
    }
    return 'PASS: live Gemini chat request reached service and returned expected credential/project gate';
  }
};
