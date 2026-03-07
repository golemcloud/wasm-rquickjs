import assert from 'assert';
import request from 'superagent';

export const run = () => {
  const req = request
    .post('http://example.com/api/users')
    .set('X-Test', 'superagent')
    .accept('json')
    .type('json')
    .send({ name: 'Ada', active: true });

  assert.strictEqual(req.method, 'POST');
  assert.strictEqual(req.get('X-Test'), 'superagent');
  assert.strictEqual(req.get('Accept'), 'application/json');
  assert.ok(req.get('Content-Type').startsWith('application/json'));
  assert.deepStrictEqual(req._data, { name: 'Ada', active: true });

  const snapshot = req.toJSON();
  assert.strictEqual(snapshot.method, 'POST');
  assert.strictEqual(snapshot.headers['x-test'], 'superagent');

  return 'PASS: request builder supports headers, json body, and request snapshot';
};
