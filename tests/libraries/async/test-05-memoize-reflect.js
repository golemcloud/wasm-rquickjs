import assert from "assert";
import async from "async";

const callbackResult = (fn, ...args) =>
  new Promise((resolve, reject) => {
    fn(...args, (error, value) => {
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    });
  });

export const run = async () => {
  let calls = 0;

  const memoized = async.memoize((key, callback) => {
    calls += 1;
    setTimeout(() => callback(null, key.toUpperCase()), 1);
  });

  const first = await callbackResult(memoized, "alpha");
  const second = await callbackResult(memoized, "alpha");
  const third = await callbackResult(memoized, "beta");

  assert.strictEqual(first, "ALPHA");
  assert.strictEqual(second, "ALPHA");
  assert.strictEqual(third, "BETA");
  assert.strictEqual(calls, 2);

  const unmemoized = async.unmemoize(memoized);
  await callbackResult(unmemoized, "alpha");
  assert.strictEqual(calls, 3);

  const reflectedTasks = async.reflectAll([
    async () => 11,
    async () => {
      throw new Error("boom");
    },
    async () => 33,
  ]);

  const reflectedResult = await async.parallel(reflectedTasks);
  assert.strictEqual(reflectedResult[0].value, 11);
  assert.strictEqual(reflectedResult[1].error.message, "boom");
  assert.strictEqual(reflectedResult[2].value, 33);

  return "PASS: memoize/unmemoize and reflectAll work";
};
