import assert from 'assert';
import jwt from 'jsonwebtoken';

export const run = () => {
  const secret = 'test-secret-04';
  const nowSec = Math.floor(Date.now() / 1000);

  const expiredToken = jwt.sign({ v: 1 }, secret, { algorithm: 'HS256', expiresIn: 1 });
  assert.throws(
    () => jwt.verify(expiredToken, secret, { algorithms: ['HS256'], clockTimestamp: nowSec + 120 }),
    (err) => err && err.name === 'TokenExpiredError'
  );

  const nbfToken = jwt.sign({ v: 2 }, secret, { algorithm: 'HS256', notBefore: 10 });
  assert.throws(
    () => jwt.verify(nbfToken, secret, { algorithms: ['HS256'], clockTimestamp: nowSec }),
    (err) => err && err.name === 'NotBeforeError'
  );

  const ignored = jwt.verify(expiredToken, secret, {
    algorithms: ['HS256'],
    clockTimestamp: nowSec + 120,
    ignoreExpiration: true,
  });
  assert.strictEqual(ignored.v, 1);

  return 'PASS: exp/nbf errors and ignoreExpiration behavior are correct';
};
