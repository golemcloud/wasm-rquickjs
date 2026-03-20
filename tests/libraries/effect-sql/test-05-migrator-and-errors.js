import assert from "assert";
import * as Migrator from "@effect/sql/Migrator";
import * as SqlError from "@effect/sql/SqlError";
import * as Effect from "effect/Effect";

export const run = async () => {
  const loader = Migrator.fromRecord({
    "002_add-users": Effect.void,
    "001_init": Effect.void,
  });

  const resolved = await Effect.runPromise(loader);
  assert.strictEqual(resolved.length, 2);
  assert.deepStrictEqual(
    resolved.map(([id, name]) => [id, name]),
    [
      [1, "init"],
      [2, "add-users"],
    ],
  );

  const sqlError = new SqlError.SqlError({ message: "custom failure" });
  assert.strictEqual(sqlError._tag, "SqlError");
  assert.strictEqual(sqlError.message, "custom failure");

  const mismatch = new SqlError.ResultLengthMismatch({ expected: 1, actual: 3 });
  assert.strictEqual(mismatch._tag, "ResultLengthMismatch");
  assert.strictEqual(mismatch.message, "Expected 1 results but got 3");

  return "PASS: Migrator loaders and SQL error types work as expected";
};
