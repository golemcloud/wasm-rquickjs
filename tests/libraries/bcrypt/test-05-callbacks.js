import assert from 'assert';
import bcrypt from 'bcrypt';

const callGenSalt = (rounds) =>
  new Promise((resolve, reject) => {
    bcrypt.genSalt(rounds, (err, salt) => (err ? reject(err) : resolve(salt)));
  });

const callHash = (value, salt) =>
  new Promise((resolve, reject) => {
    bcrypt.hash(value, salt, (err, hash) => (err ? reject(err) : resolve(hash)));
  });

const callCompare = (value, hash) =>
  new Promise((resolve, reject) => {
    bcrypt.compare(value, hash, (err, ok) => (err ? reject(err) : resolve(ok)));
  });

export const run = async () => {
  const salt = await callGenSalt(4);
  const hash = await callHash('callback-secret', salt);

  assert.strictEqual(await callCompare('callback-secret', hash), true);
  assert.strictEqual(await callCompare('other-secret', hash), false);

  return 'PASS: callback API works via async workers';
};
