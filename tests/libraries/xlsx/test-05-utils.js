import assert from "assert";
import * as XLSX from "xlsx";

export const run = () => {
  const cellRef = XLSX.utils.encode_cell({ r: 4, c: 27 });
  assert.strictEqual(cellRef, "AB5");
  assert.deepStrictEqual(XLSX.utils.decode_cell(cellRef), { r: 4, c: 27 });

  const rangeRef = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 2, c: 2 } });
  assert.strictEqual(rangeRef, "A1:C3");
  assert.deepStrictEqual(XLSX.utils.decode_range(rangeRef), {
    s: { r: 0, c: 0 },
    e: { r: 2, c: 2 },
  });

  const ws = XLSX.utils.aoa_to_sheet([
    ["part", "qty"],
    ["bolt", 4],
  ]);
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Inventory",
    Author: "wasm-rquickjs-test",
  };
  XLSX.utils.book_append_sheet(wb, ws, "Parts");

  const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const parsed = XLSX.read(bytes, { type: "array", bookProps: true });

  assert.strictEqual(parsed.Props.Title, "Inventory");
  assert.strictEqual(parsed.Props.Author, "wasm-rquickjs-test");

  return "PASS: Utility address helpers and workbook properties are preserved";
};
