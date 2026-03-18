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
  const input = 'id;comment\n1;"hello;world"\n2;"she said ""hi"""\n';
  const rows = await parseRows(input, { separator: ";" });

  assert.strictEqual(rows.length, 2);
  assert.deepStrictEqual(rows[0], { id: "1", comment: "hello;world" });
  assert.deepStrictEqual(rows[1], { id: "2", comment: 'she said "hi"' });

  return "PASS: handles custom separators and escaped quotes";
};
