import assert from 'assert';
import googleapisPkg from 'googleapis';

const BASE = 'http://localhost:18080/';

export const run = async () => {
  const { google } = googleapisPkg;
  const books = google.books('v1');

  try {
    const response = await books.volumes.list({
      auth: 'mock-api-key',
      q: 'javascript',
      maxResults: 1,
    }, {
      rootUrl: BASE,
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.kind, 'books#volumes');
    assert.strictEqual(response.data.totalItems, 1);
    assert.strictEqual(response.data.items[0].volumeInfo.title, 'Mock Book');
  } catch (error) {
    const message = error?.message ?? String(error);
    return `FAIL: books.volumes.list request failed (${message})`;
  }

  return 'PASS: books.volumes.list works against local HTTP mock server';
};
