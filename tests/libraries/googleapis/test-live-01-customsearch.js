import assert from 'assert';
import googleapisPkg from 'googleapis';

export const run = async () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey) {
    return 'FAIL: Missing GOOGLE_API_KEY environment variable';
  }
  if (!searchEngineId) {
    return 'FAIL: Missing GOOGLE_SEARCH_ENGINE_ID environment variable';
  }

  const { google } = googleapisPkg;
  const customsearch = google.customsearch('v1');

  try {
    const response = await customsearch.cse.list({
      auth: apiKey,
      cx: searchEngineId,
      q: 'site:example.com example',
      num: 1,
      safe: 'off',
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.searchInformation);
    assert.ok(typeof response.data.searchInformation.totalResults === 'string');
  } catch (error) {
    const message = error?.message ?? String(error);
    return `FAIL: live Google Custom Search request failed (${message})`;
  }

  return 'PASS: live Google Custom Search request works with API key';
};
