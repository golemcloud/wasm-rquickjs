import assert from 'assert';
import jwt from 'jsonwebtoken';

const signAsync = (payload, secret, options) => new Promise((resolve, reject) => {
  jwt.sign(payload, secret, options, (err, token) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(token);
  });
});

const verifyAsync = (token, secret, options) => new Promise((resolve, reject) => {
  jwt.verify(token, secret, options, (err, decoded) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(decoded);
  });
});

export const run = async () => {
  const secret = 'test-secret-05';

  const token = await signAsync({ mode: 'async' }, secret, { algorithm: 'HS256' });
  assert.strictEqual(typeof token, 'string');

  const decoded = await verifyAsync(token, secret, { algorithms: ['HS256'] });
  assert.strictEqual(decoded.mode, 'async');

  await assert.rejects(
    verifyAsync(token, 'wrong-secret', { algorithms: ['HS256'] }),
    (err) => err && err.name === 'JsonWebTokenError' && /invalid signature/.test(err.message)
  );

  return 'PASS: callback-based sign/verify works and reports invalid signatures';
};
