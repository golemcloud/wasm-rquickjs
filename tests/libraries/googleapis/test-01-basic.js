import assert from 'assert';
import googleapisPkg from 'googleapis';

export const run = () => {
  const { google, GoogleApis } = googleapisPkg;

  const g = new GoogleApis();
  const customsearch = g.customsearch('v1');
  const books = google.books('v1');

  assert.strictEqual(typeof g.getSupportedAPIs, 'function');
  assert.strictEqual(typeof customsearch.cse.list, 'function');
  assert.strictEqual(typeof books.volumes.list, 'function');

  return 'PASS: basic googleapis module import and service construction works';
};
