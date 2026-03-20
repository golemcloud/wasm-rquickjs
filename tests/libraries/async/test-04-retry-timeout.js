import assert from "assert";
import async from "async";

const callWithCallback = (fn) =>
  new Promise((resolve, reject) => {
    fn((error, value) => {
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    });
  });

export const run = async () => {
  let attempts = 0;
  const retryResult = await async.retry(
    { times: 4, interval: 5 },
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error("transient failure");
      }
      return "ok";
    },
  );

  assert.strictEqual(retryResult, "ok");
  assert.strictEqual(attempts, 3);

  const fast = async.timeout((callback) => callback(null, "fast"), 20);
  assert.strictEqual(await callWithCallback(fast), "fast");

  const slow = async.timeout((callback) => {
    setTimeout(() => callback(null, "slow"), 50);
  }, 10);

  try {
    await callWithCallback(slow);
    assert.fail("Expected timeout error");
  } catch (error) {
    assert.match(String(error?.message || error), /timed out/i);
  }

  return "PASS: retry and timeout helpers behave correctly";
};
