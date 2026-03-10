import assert from "assert";
import { MAX, NIL, parse, stringify, validate, version } from "uuid";

export const run = () => {
  assert.strictEqual(NIL, "00000000-0000-0000-0000-000000000000");
  assert.strictEqual(MAX, "ffffffff-ffff-ffff-ffff-ffffffffffff");

  assert.strictEqual(validate(NIL), true);
  assert.strictEqual(validate(MAX), true);
  assert.strictEqual(validate("not-a-uuid"), false);

  const id = "109156be-c4fb-41ea-b1b4-efe1671c5836";
  const bytes = parse(id);
  assert.strictEqual(bytes.length, 16);
  assert.strictEqual(stringify(bytes), id);
  assert.strictEqual(version(id), 4);

  return "PASS: constants and pure utility APIs work";
};
