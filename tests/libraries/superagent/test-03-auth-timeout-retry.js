import assert from 'assert';
import request from 'superagent';

export const run = () => {
  const req = request
    .get('http://example.com/secure')
    .auth('alice', 'secret')
    .timeout({ response: 250, deadline: 1000, upload: 500 })
    .retry(2, (error, res) => Boolean(error || (res && res.status >= 500)));

  assert.strictEqual(
    req.get('Authorization'),
    `Basic ${Buffer.from('alice:secret').toString('base64')}`
  );
  assert.strictEqual(req._responseTimeout, 250);
  assert.strictEqual(req._timeout, 1000);
  assert.strictEqual(req._uploadTimeout, 500);
  assert.strictEqual(req._maxRetries, 2);
  assert.strictEqual(typeof req._retryCallback, 'function');

  assert.strictEqual(req._shouldRetry(new Error('synthetic'), { status: 503 }), true);
  assert.strictEqual(req._shouldRetry(undefined, { status: 200 }), false);

  return 'PASS: auth, timeout options, and retry policy are configured correctly';
};
