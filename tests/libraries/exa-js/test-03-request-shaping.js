import assert from 'assert';
import Exa from 'exa-js';

export const run = async () => {
  const exa = new Exa('test-api-key', 'http://localhost:18080');

  exa.request = async (endpoint, method, body, params) => ({ endpoint, method, body, params });

  const defaultSearch = await exa.search('alpha');
  assert.strictEqual(defaultSearch.endpoint, '/search');
  assert.strictEqual(defaultSearch.method, 'POST');
  assert.strictEqual(defaultSearch.body.query, 'alpha');
  assert.strictEqual(defaultSearch.body.contents.text.maxCharacters, 10000);

  const noContentsSearch = await exa.search('beta', { contents: false, numResults: 2 });
  assert.strictEqual(noContentsSearch.body.query, 'beta');
  assert.strictEqual(noContentsSearch.body.numResults, 2);
  assert.ok(!('contents' in noContentsSearch.body));

  const findSimilar = await exa.findSimilar('https://example.com', { contents: null, numResults: 3 });
  assert.strictEqual(findSimilar.endpoint, '/findSimilar');
  assert.strictEqual(findSimilar.body.url, 'https://example.com');
  assert.strictEqual(findSimilar.body.numResults, 3);
  assert.ok(!('contents' in findSimilar.body));

  const contents = await exa.getContents('https://example.com/page', { text: { maxCharacters: 128 } });
  assert.strictEqual(contents.endpoint, '/contents');
  assert.deepStrictEqual(contents.body.urls, ['https://example.com/page']);
  assert.strictEqual(contents.body.text.maxCharacters, 128);

  return 'PASS: search/findSimilar/getContents build the expected request payloads';
};
