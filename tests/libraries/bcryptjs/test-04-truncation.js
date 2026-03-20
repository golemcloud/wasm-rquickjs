import assert from 'assert';
import bcrypt from 'bcryptjs';

export const run = () => {
  const base72 = 'a'.repeat(72);
  const longA = `${base72}X`;
  const longB = `${base72}Y`;

  assert.strictEqual(bcrypt.truncates(longA), true);
  assert.strictEqual(bcrypt.truncates('🔒'.repeat(19)), true);

  const salt = bcrypt.genSaltSync(4);
  const longHashA = bcrypt.hashSync(longA, salt);
  const longHashB = bcrypt.hashSync(longB, salt);
  assert.strictEqual(longHashA, longHashB);

  const shortHashA = bcrypt.hashSync('short-value-A', salt);
  const shortHashB = bcrypt.hashSync('short-value-B', salt);
  assert.notStrictEqual(shortHashA, shortHashB);

  return 'PASS: truncation behavior matches bcrypt 72-byte rule';
};
