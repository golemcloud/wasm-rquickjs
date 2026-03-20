import assert from 'assert';
import request from 'superagent';

export const run = () => {
  const req = request
    .get('http://example.com/plugin')
    .use((currentReq) => {
      currentReq.set('X-Plugin', 'enabled');
      currentReq.query({ source: 'plugin' });
    })
    .ok((res) => res.status === 201);

  assert.strictEqual(req.get('X-Plugin'), 'enabled');
  assert.deepStrictEqual(req.qs, { source: 'plugin' });

  assert.strictEqual(req._isResponseOK({ status: 201 }), true);
  assert.strictEqual(req._isResponseOK({ status: 500 }), false);

  return 'PASS: plugins can mutate requests and custom ok() predicate is applied';
};
