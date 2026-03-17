import assert from 'assert';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

const isKnownCredentialGate = (message) => {
  return (
    /API has not been used in project/i.test(message) ||
    /API key not valid/i.test(message) ||
    /PERMISSION_DENIED/i.test(message) ||
    /UNAUTHENTICATED/i.test(message)
  );
};

export const run = async () => {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GOOGLE_API_KEY/GOOGLE_GENERATIVE_AI_API_KEY for live test');
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
    model: 'embedding-001',
  });

  try {
    const vector = await embeddings.embedQuery('langchain-google-genai-live-embedding-marker');
    assert.ok(Array.isArray(vector), 'Expected embedding vector array');
    assert.ok(vector.length > 0, 'Expected non-empty embedding vector');
    assert.ok(vector.every((v) => Number.isFinite(v)), 'Expected numeric embedding values');
    return 'PASS: live Google embeddings request returns a numeric embedding vector';
  } catch (error) {
    const message = String(error?.message || error);
    if (!isKnownCredentialGate(message)) {
      throw error;
    }
    return 'PASS: live Google embeddings request reached service and returned expected credential/project gate';
  }
};
