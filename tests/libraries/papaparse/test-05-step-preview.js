import assert from "assert";
import Papa from "papaparse";

export const run = () => {
  const csv = "a,b\n1,x\n\n2,y\n3,z\n4,w";

  const rows = [];
  Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    step: (result) => {
      rows.push(result.data);
    },
  });

  assert.strictEqual(rows.length, 4);
  assert.deepStrictEqual(rows[0], { a: "1", b: "x" });
  assert.deepStrictEqual(rows[3], { a: "4", b: "w" });

  const preview = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    preview: 2,
  });

  assert.strictEqual(preview.errors.length, 0);
  assert.strictEqual(preview.data.length, 1);
  assert.deepStrictEqual(preview.data[0], { a: "1", b: "x" });
  assert.strictEqual(preview.meta.truncated, true);

  return "PASS: step callback and preview mode work";
};
