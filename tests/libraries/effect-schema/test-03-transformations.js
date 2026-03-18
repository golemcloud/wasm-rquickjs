import assert from "node:assert";
import * as Schema from "@effect/schema/Schema";

const EventSchema = Schema.Struct({
  count: Schema.NumberFromString,
  createdAt: Schema.DateFromString,
});

export const run = () => {
  const decode = Schema.decodeUnknownSync(EventSchema);
  const encode = Schema.encodeSync(EventSchema);

  const decoded = decode({ count: "42", createdAt: "2024-01-02T03:04:05.000Z" });
  assert.strictEqual(decoded.count, 42);
  assert.ok(decoded.createdAt instanceof Date);
  assert.strictEqual(decoded.createdAt.toISOString(), "2024-01-02T03:04:05.000Z");

  const reencoded = encode(decoded);
  assert.deepStrictEqual(reencoded, { count: "42", createdAt: "2024-01-02T03:04:05.000Z" });

  return "PASS: NumberFromString and DateFromString round-trip works";
};
