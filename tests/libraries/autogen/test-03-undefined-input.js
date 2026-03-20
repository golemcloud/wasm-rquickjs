import assert from "assert";
import autogen from "autogen";

export const run = () => {
  const result = autogen();
  assert.strictEqual(result, undefined);
  return "PASS: undefined input returns undefined";
};
