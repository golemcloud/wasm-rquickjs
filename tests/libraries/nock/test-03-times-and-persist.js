import assert from 'node:assert';
import nock from 'nock';
import { request } from './helpers.js';

export const run = async () => {
  nock.cleanAll();

  const repeatScope = nock('http://repeat.test')
    .get('/twice')
    .times(2)
    .reply(200, 'ok');

  const persistentScope = nock('http://repeat.test')
    .persist()
    .get('/always')
    .reply(200, 'always');

  const first = await request('http://repeat.test/twice');
  const second = await request('http://repeat.test/twice');
  const p1 = await request('http://repeat.test/always');
  const p2 = await request('http://repeat.test/always');

  assert.strictEqual(first.body, 'ok');
  assert.strictEqual(second.body, 'ok');
  assert.strictEqual(p1.body, 'always');
  assert.strictEqual(p2.body, 'always');
  assert.strictEqual(repeatScope.isDone(), true);
  assert.strictEqual(persistentScope.isDone(), true);

  persistentScope.persist(false);
  nock.cleanAll();

  return 'PASS: times and persist controls work';
};
