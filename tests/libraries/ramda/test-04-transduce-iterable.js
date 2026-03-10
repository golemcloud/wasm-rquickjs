import assert from "assert";
import * as R from "ramda";

function* values() {
  yield 1;
  yield 2;
  yield 3;
  yield 4;
  yield 5;
}

export const run = () => {
  const xf = R.compose(
    R.filter((n) => n % 2 === 1),
    R.map((n) => n * 10)
  );

  const output = R.transduce(xf, R.flip(R.append), [], values());
  assert.deepStrictEqual(output, [10, 30, 50]);

  const total = R.reduce((acc, n) => acc + n, 0, values());
  assert.strictEqual(total, 15);

  return "PASS: transducers and iterable reduction work";
};
