import assert from "node:assert";
import * as Schema from "@effect/schema/Schema";
import { Either } from "effect";

const PayloadSchema = Schema.parseJson(
  Schema.Struct({
    mode: Schema.Literal("dev", "prod"),
    retries: Schema.NumberFromString,
    tags: Schema.Array(Schema.String),
  }),
);

export const run = () => {
  const decode = Schema.decodeUnknownSync(PayloadSchema);
  const encode = Schema.encodeSync(PayloadSchema);

  const decoded = decode('{"mode":"prod","retries":"3","tags":["edge","cache"]}');
  assert.deepStrictEqual(decoded, { mode: "prod", retries: 3, tags: ["edge", "cache"] });

  const encoded = encode(decoded);
  assert.deepStrictEqual(JSON.parse(encoded), { mode: "prod", retries: "3", tags: ["edge", "cache"] });

  const invalid = Schema.decodeUnknownEither(PayloadSchema)("not-json");
  assert.strictEqual(Either.isLeft(invalid), true);

  return "PASS: parseJson composition decodes and encodes structured payloads";
};
