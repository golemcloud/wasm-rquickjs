import assert from "assert";
import { BSON, Binary, Decimal128, ObjectId, UUID } from "mongodb";

export const run = () => {
  const input = {
    _id: new ObjectId(),
    amount: Decimal128.fromString("42.500"),
    payload: new Binary(Uint8Array.from([1, 2, 3, 4])),
    uuid: new UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8"),
  };

  const encoded = BSON.serialize(input);
  const decoded = BSON.deserialize(encoded);

  assert.strictEqual(decoded._id.toHexString(), input._id.toHexString());
  assert.strictEqual(decoded.amount.toString(), "42.500");
  assert.deepStrictEqual(Array.from(decoded.payload.buffer), [1, 2, 3, 4]);
  assert.strictEqual(decoded.uuid.toString(), input.uuid.toString());

  return "PASS: BSON serialize/deserialize roundtrip works";
};
