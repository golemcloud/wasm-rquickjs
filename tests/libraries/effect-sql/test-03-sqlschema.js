import assert from "assert";
import * as SqlSchema from "@effect/sql/SqlSchema";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";

export const run = async () => {
  const userResult = Schema.Struct({
    id: Schema.Number,
    name: Schema.String,
  });

  const findOne = SqlSchema.findOne({
    Request: Schema.Number,
    Result: userResult,
    execute: (id) => Effect.succeed(id === 1 ? [{ id: 1, name: "Alice" }] : []),
  });

  const single = SqlSchema.single({
    Request: Schema.Number,
    Result: Schema.Struct({ id: Schema.Number }),
    execute: (id) => Effect.succeed(id === 1 ? [{ id: 1 }] : []),
  });

  const found = await Effect.runPromise(findOne(1));
  assert.ok(Option.isSome(found));
  if (Option.isSome(found)) {
    assert.strictEqual(found.value.name, "Alice");
  }

  const missing = await Effect.runPromise(findOne(2));
  assert.ok(Option.isNone(missing));

  const missingExit = await Effect.runPromiseExit(single(2));
  assert.strictEqual(missingExit._tag, "Failure");

  return "PASS: SqlSchema wrappers validate and shape query results";
};
