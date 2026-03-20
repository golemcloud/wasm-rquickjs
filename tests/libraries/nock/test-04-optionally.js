import assert from 'node:assert';
import nock from 'nock';
import { request } from './helpers.js';

export const run = async () => {
  nock.cleanAll();

  const scope = nock('http://optional.test')
    .get('/required')
    .reply(200, 'required')
    .get('/optional')
    .optionally()
    .reply(200, 'optional');

  const response = await request('http://optional.test/required');

  assert.strictEqual(response.body, 'required');
  assert.strictEqual(scope.isDone(), true);

  nock.cleanAll();
  return 'PASS: optional interceptors do not block done()';
};
