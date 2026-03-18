import assert from "assert";
import { Effect, pipe } from "effect";

export const run = () => {
  const program = Effect.gen(function* () {
    const left = yield* Effect.succeed(6);
    const right = yield* Effect.sync(() => 7);
    return left * right;
  });

  const product = Effect.runSync(program);
  assert.strictEqual(product, 42);

  const recovered = Effect.runSync(
    pipe(
      Effect.fail("boom"),
      Effect.catchAll((err) => Effect.succeed(`recovered:${err}`))
    )
  );

  assert.strictEqual(recovered, "recovered:boom");
  return "PASS: Effect.runSync handles success and recovery";
};
