import assert from "node:assert";
import * as Schema from "@effect/schema/Schema";
import { Either } from "effect";

const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  roles: Schema.Array(Schema.String),
});

export const run = () => {
  const decode = Schema.decodeUnknownSync(UserSchema);
  const decoded = decode({ id: 1, name: "Ada", roles: ["admin", "author"] });
  assert.deepStrictEqual(decoded, { id: 1, name: "Ada", roles: ["admin", "author"] });

  const invalid = Schema.decodeUnknownEither(UserSchema)({ id: "1", name: "Ada", roles: [] });
  assert.strictEqual(Either.isLeft(invalid), true);

  return "PASS: struct decode and typed error path work";
};
