import assert from "assert";
import autogen from "autogen";

export const run = () => {
  const libs = ["a", "b"];
  const result = autogen(libs);
  assert.strictEqual(result, libs);

  result.push("c");
  assert.deepStrictEqual(libs, ["a", "b", "c"]);
  return "PASS: preserves input reference identity";
};
