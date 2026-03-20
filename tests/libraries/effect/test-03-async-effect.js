import assert from "assert";
import { Effect } from "effect";

export const run = async () => {
  const promised = await Effect.runPromise(Effect.promise(() => Promise.resolve(21)));
  assert.strictEqual(promised, 21);

  const start = Date.now();
  const slept = await Effect.runPromise(
    Effect.gen(function* () {
      yield* Effect.sleep(1);
      return "awake";
    })
  );
  const elapsed = Date.now() - start;

  assert.strictEqual(slept, "awake");
  assert.ok(elapsed >= 0);
  return "PASS: async Effect APIs (runPromise/sleep) work";
};
