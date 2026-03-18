import assert from "assert";
import Papa from "papaparse";

export const run = () => {
  const csv = 'id,value\n1,"hello, world"\n2,"line1\nline2"\n3,"say ""hi"""';
  const result = Papa.parse(csv, { header: true });

  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.data.length, 3);
  assert.strictEqual(result.data[0].value, "hello, world");
  assert.strictEqual(result.data[1].value, "line1\nline2");
  assert.strictEqual(result.data[2].value, 'say "hi"');

  return "PASS: quoted fields and escaped quotes parse correctly";
};
