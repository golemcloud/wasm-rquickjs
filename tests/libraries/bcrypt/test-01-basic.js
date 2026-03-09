import assert from 'assert';
import bcrypt from 'bcrypt';

export const run = async () => {
  const password = 'correct horse battery staple';
  const hash = await bcrypt.hash(password, 4);

  assert.ok(hash.startsWith('$2'), 'Expected bcrypt hash prefix');
  assert.strictEqual(await bcrypt.compare(password, hash), true);

  return 'PASS: async hash/compare works';
};
