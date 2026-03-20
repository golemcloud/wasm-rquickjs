import assert from "assert";
import * as R from "ramda";

export const run = () => {
  const replaceMiddle = R.curry((left, middle, right) => `${left}-${middle}-${right}`);
  const withFixedMiddle = replaceMiddle(R.__, "M", R.__);

  assert.strictEqual(withFixedMiddle("L", "R"), "L-M-R");

  const scoreLabel = R.cond([
    [R.gte(R.__, 90), R.always("excellent")],
    [R.gte(R.__, 70), R.always("good")],
    [R.T, R.always("ok")],
  ]);

  assert.strictEqual(scoreLabel(95), "excellent");
  assert.strictEqual(scoreLabel(80), "good");
  assert.strictEqual(scoreLabel(50), "ok");

  return "PASS: curry placeholders and conditional combinators work";
};
