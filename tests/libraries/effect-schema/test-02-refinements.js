import assert from "node:assert";
import * as Schema from "@effect/schema/Schema";
import { Option } from "effect";

const PasswordSchema = Schema.String.pipe(
  Schema.minLength(8),
  Schema.pattern(/[A-Z]/),
  Schema.pattern(/[0-9]/),
);

export const run = () => {
  const decode = Schema.decodeUnknownSync(PasswordSchema);
  assert.strictEqual(decode("StrongPass9"), "StrongPass9");

  const invalid = Schema.decodeUnknownOption(PasswordSchema)("weak");
  assert.strictEqual(Option.isNone(invalid), true);

  return "PASS: string refinements and Option decode work";
};
