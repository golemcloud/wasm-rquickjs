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
  const input =
    "intro line to skip\n#comment to skip\nFirst Name,Score\n Alice , 10 \nBob, 7\n";

  const rows = await parseRows(input, {
    skipLines: 1,
    skipComments: true,
    mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, "_"),
    mapValues: ({ value }) => value.trim(),
  });

  assert.strictEqual(rows.length, 2);
  assert.deepStrictEqual(rows[0], { first_name: "Alice", score: "10" });
  assert.deepStrictEqual(rows[1], { first_name: "Bob", score: "7" });

  return "PASS: applies header and value mapping with skipped lines/comments";
};
