import assert from 'assert';
import bcrypt from 'bcryptjs';

export const run = async () => {
  const password = 'async-password';
  const salt = await bcrypt.genSalt(4);
  const hash = await bcrypt.hash(password, salt);

  const ok = await bcrypt.compare(password, hash);
  const wrong = await bcrypt.compare('other-password', hash);

  assert.strictEqual(ok, true);
  assert.strictEqual(wrong, false);

  const callbackResult = await new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  assert.strictEqual(callbackResult, true);

  return 'PASS: async promise/callback APIs work';
};
