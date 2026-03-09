import assert from 'assert';
import bcrypt from 'bcryptjs';

export const run = async () => {
  const invalidHash = 'not-a-real-hash';

  assert.strictEqual(bcrypt.compareSync('pw', invalidHash), false);
  assert.strictEqual(await bcrypt.compare('pw', invalidHash), false);

  assert.throws(() => bcrypt.getSalt(invalidHash), /Illegal hash length/);

  const lowRoundsSalt = bcrypt.genSaltSync(1);
  const highRoundsSalt = bcrypt.genSaltSync(99);
  const defaultHash = bcrypt.hashSync('default-rounds');

  assert.strictEqual(lowRoundsSalt.split('$')[2], '04');
  assert.strictEqual(highRoundsSalt.split('$')[2], '31');
  assert.strictEqual(bcrypt.getRounds(defaultHash), 10);

  return 'PASS: validation and rounds clamping behavior works';
};
