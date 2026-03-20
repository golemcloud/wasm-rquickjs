import assert from "assert";
import * as XLSX from "xlsx";

export const run = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ["name", "score"],
    ["Alice", 10],
    ["Bob", 20],
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Scores");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const parsed = XLSX.read(out, { type: "array" });
  const rows = XLSX.utils.sheet_to_json(parsed.Sheets.Scores);

  assert.deepStrictEqual(rows, [
    { name: "Alice", score: 10 },
    { name: "Bob", score: 20 },
  ]);

  return "PASS: Basic workbook write/read roundtrip preserves data";
};
