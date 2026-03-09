import assert from 'node:assert';
import nock from 'nock';
import { request } from './helpers.js';

export const run = async () => {
  nock.cleanAll();

  const scope = nock('http://example.test')
    .get('/hello')
    .reply(200, { ok: true, source: 'nock' });

  const response = await request('http://example.test/hello');

  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(response.body), { ok: true, source: 'nock' });
  assert.strictEqual(scope.isDone(), true);

  nock.cleanAll();
  return 'PASS: basic GET interception and JSON reply';
};
