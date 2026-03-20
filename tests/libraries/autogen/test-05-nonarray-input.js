import assert from "assert";
import autogen from "autogen";

export const run = () => {
  const value = 42;
  const result = autogen(value);
  assert.strictEqual(result, 42);
  return "PASS: primitive inputs are returned unchanged";
};
