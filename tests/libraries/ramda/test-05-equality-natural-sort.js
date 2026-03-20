import assert from "assert";
import * as R from "ramda";

export const run = () => {
  const left = {
    tags: new Set(["a", "b"]),
    pairs: new Map([
      ["x", 1],
      ["y", 2],
    ]),
  };
  const right = {
    tags: new Set(["a", "b"]),
    pairs: new Map([
      ["x", 1],
      ["y", 2],
    ]),
  };

  assert.strictEqual(R.equals(left, right), true);

  const naturallySorted = R.sortWith([
    R.ascendNatural("en", R.identity),
  ], ["item-10", "item-2", "item-1"]);

  assert.deepStrictEqual(naturallySorted, ["item-1", "item-2", "item-10"]);

  return "PASS: deep equality and natural sorting work";
};
