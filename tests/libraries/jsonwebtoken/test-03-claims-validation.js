import assert from 'assert';
import jwt from 'jsonwebtoken';

export const run = () => {
  const secret = 'test-secret-03';
  const token = jwt.sign(
    { data: 'x' },
    secret,
    {
      algorithm: 'HS256',
      audience: 'api-users',
      issuer: 'issuer-1',
      subject: 'subject-1',
      jwtid: 'jwt-1',
    }
  );

  const ok = jwt.verify(token, secret, {
    algorithms: ['HS256'],
    audience: 'api-users',
    issuer: 'issuer-1',
    subject: 'subject-1',
    jwtid: 'jwt-1',
  });
  assert.strictEqual(ok.data, 'x');

  assert.throws(
    () => jwt.verify(token, secret, { algorithms: ['HS256'], audience: 'wrong-audience' }),
    (err) => err && err.name === 'JsonWebTokenError' && /audience invalid/.test(err.message)
  );

  return 'PASS: claim validation succeeds and rejects invalid audience';
};
