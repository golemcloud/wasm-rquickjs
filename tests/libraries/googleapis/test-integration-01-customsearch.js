import assert from 'assert';
import googleapisPkg from 'googleapis';

const BASE = 'http://localhost:18080/';

export const run = async () => {
  const { google } = googleapisPkg;
  const customsearch = google.customsearch('v1');

  try {
    const response = await customsearch.cse.list({
      auth: 'mock-api-key',
      cx: 'mock-search-engine-id',
      q: 'wasm-rquickjs',
      num: 1,
    }, {
      rootUrl: BASE,
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.kind, 'customsearch#search');
    assert.strictEqual(response.data.items.length, 1);
    assert.strictEqual(response.data.items[0].title, 'wasm-rquickjs repository');
  } catch (error) {
    const message = error?.message ?? String(error);
    return `FAIL: customsearch.cse.list request failed (${message})`;
  }

  return 'PASS: customsearch.cse.list works against local HTTP mock server';
};
