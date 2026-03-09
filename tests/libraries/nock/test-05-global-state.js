import assert from 'node:assert';
import nock from 'nock';
import { request } from './helpers.js';

export const run = async () => {
  nock.cleanAll();
  nock.disableNetConnect();

  const scope = nock('http://state.test')
    .get('/status')
    .reply(200, 'ok');

  assert.strictEqual(nock.pendingMocks().length, 1);

  const response = await request('http://state.test/status');

  assert.strictEqual(response.body, 'ok');
  assert.strictEqual(scope.isDone(), true);
  assert.strictEqual(nock.pendingMocks().length, 0);
  assert.strictEqual(nock.isDone(), true);

  nock.enableNetConnect();
  nock.cleanAll();
  return 'PASS: global pending/isDone state updates after interception';
};
