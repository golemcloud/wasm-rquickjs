import assert from 'assert';
import bcrypt from 'bcrypt';

export const run = async () => {
  assert.throws(() => bcrypt.getRounds('not-a-bcrypt-hash'));

  let rejected = false;
  try {
    await bcrypt.hash(undefined, 4);
  } catch (err) {
    rejected = true;
    const msg = String(err?.message || err);
    assert.match(msg, /data|salt|string|buffer|required/i);
  }

  assert.ok(rejected, 'Expected hash(undefined, 4) to reject');

  return 'PASS: validation errors are surfaced';
};
