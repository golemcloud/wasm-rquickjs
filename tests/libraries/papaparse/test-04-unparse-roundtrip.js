import assert from "assert";
import Papa from "papaparse";

export const run = () => {
  const original = [
    { name: "Alice Wonderland", score: 100, notes: "first, place" },
    { name: "Bob", score: 42, notes: "" },
  ];

  const csv = Papa.unparse(original, { header: true });
  const parsed = Papa.parse(csv, { header: true });

  assert.strictEqual(parsed.errors.length, 0);
  assert.strictEqual(parsed.data.length, 2);
  assert.deepStrictEqual(parsed.data[0], {
    name: "Alice Wonderland",
    score: "100",
    notes: "first, place",
  });
  assert.deepStrictEqual(parsed.data[1], {
    name: "Bob",
    score: "42",
    notes: "",
  });

  return "PASS: unparse output round-trips through parse";
};
