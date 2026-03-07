import assert from 'assert';
import request from 'superagent';

export const run = () => {
  const req = request
    .get('http://example.com/search')
    .query({ fromObject: '1' })
    .query('c=3')
    .query('a=1')
    .query('b=2')
    .sortQuery();

  assert.deepStrictEqual(req.qs, { fromObject: '1' });

  req._finalizeQueryString();

  const url = new URL(req.url);
  assert.strictEqual(url.search, '?a=1&b=2&c=3');

  return 'PASS: query params are accumulated and sorted deterministically';
};
