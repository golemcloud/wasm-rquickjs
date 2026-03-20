import assert from "assert";
import { validate, v4, v7, version } from "uuid";

export const run = () => {
  const a = v4();
  const b = v4();
  assert.strictEqual(validate(a), true);
  assert.strictEqual(validate(b), true);
  assert.strictEqual(version(a), 4);
  assert.strictEqual(version(b), 4);
  assert.notStrictEqual(a, b);

  const t1 = v7();
  const t2 = v7();
  assert.strictEqual(validate(t1), true);
  assert.strictEqual(validate(t2), true);
  assert.strictEqual(version(t1), 7);
  assert.strictEqual(version(t2), 7);
  assert.notStrictEqual(t1, t2);

  return "PASS: default random UUID generation works";
};
