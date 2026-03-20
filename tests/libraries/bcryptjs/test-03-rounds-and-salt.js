import assert from 'assert';
import bcrypt from 'bcryptjs';

export const run = () => {
  const hash = bcrypt.hashSync('rounds-check', 6);
  const rounds = bcrypt.getRounds(hash);
  const salt = bcrypt.getSalt(hash);

  assert.strictEqual(rounds, 6);
  assert.strictEqual(salt.length, 29);
  assert.ok(salt.startsWith('$2b$06$'));

  const rehash = bcrypt.hashSync('rounds-check', salt);
  assert.strictEqual(rehash, hash);

  return 'PASS: getRounds/getSalt metadata APIs work';
};
