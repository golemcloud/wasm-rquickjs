import assert from "assert";
import csvParser from "csv-parser";

const parseRows = (input, options = {}) =>
  new Promise((resolve, reject) => {
    const rows = [];
    const parser = csvParser(options);

    parser.on("data", (row) => rows.push(row));
    parser.on("error", reject);
    parser.on("end", () => resolve(rows));

    parser.write(input);
    parser.end();
  });

export const run = async () => {
  const input = "x,y\n1,2\n3,4\n";
  const rows = await parseRows(input, {
    headers: false,
    outputByteOffset: true,
  });

  assert.strictEqual(rows.length, 3);
  assert.deepStrictEqual(rows[0].row, { "0": "x", "1": "y" });
  assert.deepStrictEqual(rows[1].row, { "0": "1", "1": "2" });
  assert.deepStrictEqual(rows[2].row, { "0": "3", "1": "4" });
  assert.strictEqual(rows[0].byteOffset, 0);
  assert.ok(rows[1].byteOffset > rows[0].byteOffset);
  assert.ok(rows[2].byteOffset > rows[1].byteOffset);

  return "PASS: supports headers=false with output byte offsets";
};
