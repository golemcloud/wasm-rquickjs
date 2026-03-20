import assert from 'assert';
import googleapisPkg from 'googleapis';

const BASE = 'http://localhost:18080/';

export const run = async () => {
  const { google } = googleapisPkg;
  const customsearch = google.customsearch('v1');

  try {
    await customsearch.cse.list({
      auth: 'mock-api-key',
      cx: 'mock-search-engine-id',
      q: 'trigger-error',
    }, {
      rootUrl: BASE,
    });

    return 'FAIL: customsearch error path unexpectedly succeeded';
  } catch (error) {
    const message = error?.message ?? String(error);
    const status = error?.response?.status ?? error?.status;

    if (message.includes('mock internal error') && status === 500) {
      return 'PASS: customsearch surfaces HTTP 500 errors from the server';
    }

    return `FAIL: unexpected error shape (${message}; status=${status ?? 'unknown'})`;
  }
};
