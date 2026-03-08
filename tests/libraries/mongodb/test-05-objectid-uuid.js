import assert from "assert";
import { ObjectId, UUID } from "mongodb";

export const run = () => {
  const generated = new ObjectId();
  const parsed = ObjectId.createFromHexString(generated.toHexString());

  assert.strictEqual(generated.equals(parsed), true);
  assert.strictEqual(ObjectId.isValid(generated.toHexString()), true);
  assert.strictEqual(ObjectId.isValid("not-an-object-id"), false);

  const uuid = new UUID();
  const fromString = new UUID(uuid.toString());

  assert.strictEqual(uuid.equals(fromString), true);
  assert.strictEqual(uuid.toString().length, 36);

  return "PASS: ObjectId and UUID conversion helpers work";
};
