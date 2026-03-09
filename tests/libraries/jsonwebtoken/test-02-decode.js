import assert from 'assert';
import jwt from 'jsonwebtoken';

export const run = () => {
  const payload = { role: 'admin', active: true };
  const secret = 'test-secret-02';
  const token = jwt.sign(payload, secret, { algorithm: 'HS512', header: { kid: 'k-1' } });

  const complete = jwt.decode(token, { complete: true });
  assert.ok(complete);
  assert.strictEqual(complete.header.alg, 'HS512');
  assert.strictEqual(complete.header.kid, 'k-1');
  assert.strictEqual(complete.payload.role, 'admin');
  assert.strictEqual(typeof complete.signature, 'string');

  const payloadOnly = jwt.decode(token);
  assert.strictEqual(payloadOnly.active, true);

  return 'PASS: decode returns expected payload/header without verification';
};
