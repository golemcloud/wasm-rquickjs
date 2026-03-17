import assert from "assert";
import autogen from "autogen";

export const run = () => {
  const payload = {
    libs: ["foo"],
    options: { optimize: true },
  };

  const result = autogen(payload);
  assert.strictEqual(result, payload);
  assert.deepStrictEqual(result.options, { optimize: true });
  return "PASS: object inputs are returned unchanged";
};
