import assert from 'assert';
import bcrypt from 'bcryptjs';

export const run = () => {
  const password = 'correct horse battery staple';
  const salt = bcrypt.genSaltSync(4);

  assert.ok(salt.startsWith('$2b$04$'));

  const hash = bcrypt.hashSync(password, salt);
  assert.strictEqual(hash.length, 60);
  assert.ok(bcrypt.compareSync(password, hash));
  assert.ok(!bcrypt.compareSync('wrong-password', hash));

  return 'PASS: sync salt/hash/compare roundtrip works';
};
