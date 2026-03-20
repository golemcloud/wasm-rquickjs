import assert from "assert";
import autogen from "autogen";

export const run = () => {
  const libs = ["libmill", "libsodium", "nanomsg"];
  const result = autogen(libs);
  assert.deepStrictEqual(result, libs);
  return "PASS: returns the same list of libraries";
};
