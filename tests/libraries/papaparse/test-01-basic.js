import assert from "assert";
import Papa from "papaparse";

export const run = () => {
  const csv = "name,age,city\nAlice,30,London\nBob,25,Paris";
  const result = Papa.parse(csv, { header: true });

  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.data.length, 2);
  assert.deepStrictEqual(result.data[0], { name: "Alice", age: "30", city: "London" });
  assert.deepStrictEqual(result.data[1], { name: "Bob", age: "25", city: "Paris" });
  assert.strictEqual(result.meta.delimiter, ",");

  return "PASS: basic header parsing works";
};
