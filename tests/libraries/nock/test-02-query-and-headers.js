import assert from 'node:assert';
import nock from 'nock';
import { request } from './helpers.js';

export const run = async () => {
  nock.cleanAll();

  const scope = nock('http://api.test')
    .matchHeader('x-api-key', 'secret-token')
    .get('/search')
    .query({ q: 'cats', page: '2' })
    .reply(200, (uri) => ({ uriMatched: uri }));

  const response = await request('http://api.test/search?q=cats&page=2', {
    headers: { 'x-api-key': 'secret-token' },
  });

  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(response.body), { uriMatched: '/search?q=cats&page=2' });
  assert.strictEqual(scope.isDone(), true);

  nock.cleanAll();
  return 'PASS: query and header matching works';
};
