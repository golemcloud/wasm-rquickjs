import assert from 'assert';
import bcrypt from 'bcrypt';

export const run = async () => {
  const salt = await bcrypt.genSalt(6);
  const hash = await bcrypt.hash(Buffer.from('variant-pass'), salt);

  assert.strictEqual(await bcrypt.compare(Buffer.from('variant-pass'), hash), true);
  assert.strictEqual(await bcrypt.compare('wrong-pass', hash), false);

  return 'PASS: compare handles buffer input and mismatches';
};
