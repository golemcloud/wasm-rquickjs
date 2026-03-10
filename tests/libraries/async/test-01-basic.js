import assert from "assert";
import async from "async";

export const run = async () => {
  const mapped = await async.map([1, 2, 3], async (value) => value * 3);
  assert.deepStrictEqual(mapped, [3, 6, 9]);

  const filtered = await async.filter([2, 3, 4, 5, 6], async (value) => value % 2 === 0);
  assert.deepStrictEqual(filtered, [2, 4, 6]);

  const reduced = await async.reduce([1, 2, 3, 4], 0, async (memo, item) => memo + item);
  assert.strictEqual(reduced, 10);

  return "PASS: map/filter/reduce promise APIs work";
};
