import assert from "assert";
import Papa from "papaparse";

export const run = () => {
  const csv = "num,flag,when,empty\n42,true,2024-01-15T10:00:00.000Z,\n3.14,false,,";
  const result = Papa.parse(csv, {
    header: true,
    dynamicTyping: true,
  });

  assert.strictEqual(result.errors.length, 0);

  const first = result.data[0];
  const second = result.data[1];

  assert.strictEqual(first.num, 42);
  assert.strictEqual(first.flag, true);
  assert.ok(first.when instanceof Date);
  assert.strictEqual(first.when.toISOString(), "2024-01-15T10:00:00.000Z");
  assert.strictEqual(first.empty, null);

  assert.strictEqual(second.num, 3.14);
  assert.strictEqual(second.flag, false);
  assert.strictEqual(second.when, null);
  assert.strictEqual(second.empty, null);

  return "PASS: dynamic typing converts primitives and dates";
};
