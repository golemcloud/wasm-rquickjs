import assert from "assert";
import { createIdGenerator, generateId } from "ai";

export const run = () => {
  const id1 = generateId();
  const id2 = generateId();
  assert.strictEqual(typeof id1, "string");
  assert.strictEqual(typeof id2, "string");
  assert.notStrictEqual(id1, id2);

  const prefixedGenerator = createIdGenerator({
    prefix: "msg",
    separator: "_",
    size: 8,
  });

  const customId = prefixedGenerator();
  assert.ok(customId.startsWith("msg_"));
  assert.ok(customId.length > 8);

  return "PASS: generateId and createIdGenerator produce unique IDs";
};
