import assert from 'assert';
import bcrypt from 'bcrypt';

export const run = () => {
  const salt = bcrypt.genSaltSync(5);
  const hash = bcrypt.hashSync(Buffer.from('sync-secret'), salt);

  assert.strictEqual(bcrypt.compareSync('sync-secret', hash), true);
  assert.strictEqual(bcrypt.getRounds(hash), 5);

  return 'PASS: sync API supports buffer input and rounds extraction';
};
