import assert from 'node:assert';
import { createRequire } from 'node:module';
import { customAlphabet } from 'nanoid';
import * as cookie from 'cookie';

const require = createRequire(import.meta.url);
const signature = require('cookie-signature');

export const run = () => {
  const makeId = customAlphabet('abc123', 12);
  const id = makeId();
  assert.match(id, /^[abc123]{12}$/);

  const serialized = cookie.serialize('session', id, { httpOnly: true, sameSite: 'strict' });
  assert(serialized.includes('HttpOnly'));
  const parsed = cookie.parse(`session=${id}; theme=dark`);
  assert.strictEqual(parsed.session, id);
  assert.strictEqual(parsed.theme, 'dark');

  const signed = signature.sign(id, 'secret');
  assert.strictEqual(signature.unsign(signed, 'secret'), id);
  assert.strictEqual(signature.unsign(signed, 'wrong'), false);
  return 'PASS: nanoid, cookie, and cookie-signature work from installed packages';
};
