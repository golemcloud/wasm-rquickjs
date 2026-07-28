import assert from 'node:assert';
import { SignJWT, jwtVerify } from 'jose';

export const run = async () => {
  const secret = new TextEncoder().encode('0123456789abcdef0123456789abcdef');
  const token = await new SignJWT({ scope: 'installed-app' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('user-1')
    .sign(secret);
  const { payload, protectedHeader } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  assert.strictEqual(protectedHeader.alg, 'HS256');
  assert.strictEqual(payload.sub, 'user-1');
  assert.strictEqual(payload.scope, 'installed-app');
  return 'PASS: jose ESM JWT signing and verification works from node_modules';
};
