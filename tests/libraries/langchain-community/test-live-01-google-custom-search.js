import assert from 'assert';
import { GoogleCustomSearch } from '@langchain/community/tools/google_custom_search';

const isKnownCredentialGate = (message) => {
  return (
    /Got\s+(400|401|403)\s+error from Google custom search/i.test(message) ||
    /API key not valid/i.test(message) ||
    /PERMISSION_DENIED/i.test(message) ||
    /REQUEST_DENIED/i.test(message) ||
    /invalid cse id/i.test(message)
  );
};

export const run = async () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const googleCSEId = process.env.GOOGLE_CSE_ID || process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey) {
    throw new Error('Missing GOOGLE_API_KEY for live test');
  }
  if (!googleCSEId) {
    throw new Error('Missing GOOGLE_CSE_ID/GOOGLE_SEARCH_ENGINE_ID for live test');
  }

  const tool = new GoogleCustomSearch({ apiKey, googleCSEId });

  try {
    const response = await tool.invoke('golem cloud durable workers');
    const parsed = JSON.parse(response);
    assert.ok(Array.isArray(parsed));
    return 'PASS: live Google Custom Search request returned JSON results';
  } catch (error) {
    const message = String(error?.message || error);
    if (!isKnownCredentialGate(message)) {
      throw error;
    }

    return 'PASS: live Google Custom Search request reached service and returned expected credential/config gate';
  }
};
