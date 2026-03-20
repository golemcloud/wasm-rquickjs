import assert from "node:assert";
import * as Schema from "@effect/schema/Schema";

const CsvNumbers = Schema.transform(
  Schema.String,
  Schema.Array(Schema.Number),
  {
    strict: true,
    decode: (value) => value.split(",").map((part) => Number(part.trim())),
    encode: (values) => values.join(","),
  },
);

export const run = () => {
  const decode = Schema.decodeUnknownSync(CsvNumbers);
  const encode = Schema.encodeSync(CsvNumbers);

  const decoded = decode("10, 20, 30");
  assert.deepStrictEqual(decoded, [10, 20, 30]);

  const encoded = encode([1, 2, 3]);
  assert.strictEqual(encoded, "1,2,3");

  return "PASS: custom transform decode and encode work";
};
