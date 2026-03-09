import assert from "assert";
import { parsePartialJson } from "ai";

export const run = async () => {
  const complete = await parsePartialJson('{"name":"alice","age":7}');
  assert.strictEqual(complete.state, "successful-parse");
  assert.deepStrictEqual(complete.value, { name: "alice", age: 7 });

  const partial = await parsePartialJson('{"name":"ali');
  assert.strictEqual(partial.state, "repaired-parse");
  assert.strictEqual(partial.value.name, "ali");

  const missing = await parsePartialJson(undefined);
  assert.strictEqual(missing.state, "undefined-input");
  assert.strictEqual(missing.value, undefined);

  return "PASS: parsePartialJson handles complete, partial, and undefined input";
};
