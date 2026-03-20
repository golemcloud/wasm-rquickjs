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
  const rows = await parseRows("name,age\nAlice,30\nBob,22\n");

  assert.strictEqual(rows.length, 2);
  assert.deepStrictEqual(rows[0], { name: "Alice", age: "30" });
  assert.deepStrictEqual(rows[1], { name: "Bob", age: "22" });

  return "PASS: parses basic CSV rows into objects";
};
