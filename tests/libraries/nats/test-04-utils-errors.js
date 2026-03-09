import assert from "assert";
import {
  ErrorCode,
  NatsError,
  backoff,
  deadline,
  deferred,
  delay,
  millis,
  nanos,
  timeout,
} from "nats";

export const run = async () => {
  const d = deferred();
  setTimeout(() => d.resolve("ready"), 5);
  const deferredValue = await d;
  assert.strictEqual(deferredValue, "ready");

  const delayed = await delay(5);
  assert.strictEqual(delayed, undefined);

  const bounded = await deadline(Promise.resolve("ok"), 20);
  assert.strictEqual(bounded, "ok");

  let timedOut = false;
  try {
    await timeout(5);
  } catch (err) {
    timedOut = true;
    assert.ok((err.message || String(err)).toLowerCase().includes("timeout"));
  }
  assert.ok(timedOut, "timeout() should reject");

  const calc = backoff();
  const b1 = calc.backoff(1);
  const b4 = calc.backoff(4);
  assert.ok(b1 >= 0);
  assert.ok(b4 >= b1);

  const roundTrip = millis(nanos(42));
  assert.strictEqual(roundTrip, 42);

  const err = NatsError.errorForCode(ErrorCode.BadJson, new Error("bad json"));
  assert.ok(err instanceof NatsError);
  assert.strictEqual(err.code, ErrorCode.BadJson);

  return "PASS: utility timing helpers, backoff, and NatsError handling work";
};
