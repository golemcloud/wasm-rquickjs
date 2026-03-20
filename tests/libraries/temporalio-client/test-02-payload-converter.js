import assert from "assert";
import { defaultPayloadConverter } from "@temporalio/client";

export const run = () => {
  const decoder = new TextDecoder();

  const input = {
    str: "temporal",
    num: 42,
    bool: true,
    nested: { a: [1, 2, 3] },
    nil: null,
  };

  const payload = defaultPayloadConverter.toPayload(input);
  assert.ok(payload);
  assert.strictEqual(decoder.decode(payload.metadata.encoding), "json/plain");

  const roundTrip = defaultPayloadConverter.fromPayload(payload);
  assert.deepStrictEqual(roundTrip, input);

  const bytes = new Uint8Array([1, 2, 3, 255]);
  const binaryPayload = defaultPayloadConverter.toPayload(bytes);
  assert.strictEqual(decoder.decode(binaryPayload.metadata.encoding), "binary/plain");
  const roundTripBytes = defaultPayloadConverter.fromPayload(binaryPayload);
  assert.deepStrictEqual(Array.from(roundTripBytes), Array.from(bytes));

  return "PASS: default payload converter supports json and binary round-trips";
};
