import assert from "assert";
import codec from "amqplib/lib/codec.js";

export const run = () => {
  const table = {
    text: "hello",
    count: 42,
    flag: true,
    ratio: 3.5,
    nested: { key: "value" },
    list: [1, "two", false],
    nothing: null,
  };

  const buffer = Buffer.alloc(4096);
  const size = codec.encodeTable(buffer, table, 0);
  const decoded = codec.decodeFields(buffer.subarray(4, size));

  assert.deepStrictEqual(decoded, table);

  return "PASS: codec encodeTable/decodeFields round-trip works";
};
