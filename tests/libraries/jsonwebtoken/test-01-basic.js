import assert from 'assert';
import jwt from 'jsonwebtoken';

export const run = () => {
  const payload = { sub: 'user-123', scope: ['read', 'write'] };
  const secret = 'test-secret-01';

  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
  assert.strictEqual(typeof token, 'string');

  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  assert.strictEqual(decoded.sub, 'user-123');
  assert.deepStrictEqual(decoded.scope, ['read', 'write']);

  return 'PASS: HS256 sign/verify works';
};
