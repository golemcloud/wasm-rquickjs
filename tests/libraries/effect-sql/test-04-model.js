import assert from "assert";
import * as Model from "@effect/sql/Model";
import * as Schema from "effect/Schema";

class User extends Model.Class("User")({
  id: Model.Generated(Schema.Number),
  name: Schema.NonEmptyTrimmedString,
  active: Model.BooleanFromNumber,
}) {}

export const run = () => {
  const decodeInsert = Schema.decodeUnknownSync(User.insert);
  const decodeSelect = Schema.decodeUnknownSync(User);

  const insertRow = decodeInsert({
    name: "Alice",
    active: 1,
  });
  assert.deepStrictEqual(insertRow, {
    name: "Alice",
    active: true,
  });

  const selectedRow = decodeSelect({
    id: 7,
    name: "Alice",
    active: 0,
  });
  assert.ok(selectedRow instanceof User);
  assert.strictEqual(selectedRow.id, 7);
  assert.strictEqual(selectedRow.name, "Alice");
  assert.strictEqual(selectedRow.active, false);

  return "PASS: Model.Class exposes insert/select variants with field transforms";
};
