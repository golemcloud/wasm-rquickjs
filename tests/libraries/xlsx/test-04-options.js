import assert from "assert";
import * as XLSX from "xlsx";

export const run = () => {
  const eventDate = new Date(Date.UTC(2026, 2, 18, 12, 30, 0));

  const ws = XLSX.utils.aoa_to_sheet([
    ["when", "value"],
    [eventDate, 42],
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dates");

  const bytes = XLSX.write(wb, {
    type: "array",
    bookType: "xlsx",
    cellDates: true,
  });

  const parsed = XLSX.read(bytes, {
    type: "array",
    cellDates: true,
  });

  const dateCell = parsed.Sheets.Dates.A2;
  assert(dateCell instanceof Object);
  assert.strictEqual(dateCell.t, "d");
  assert(dateCell.v instanceof Date, `Expected Date instance, got ${Object.prototype.toString.call(dateCell.v)}`);

  const rows = XLSX.utils.sheet_to_json(parsed.Sheets.Dates, { raw: true });
  assert.strictEqual(rows[0].value, 42);
  assert(rows[0].when instanceof Date, "Expected sheet_to_json(raw:true) to preserve Date object");

  return "PASS: Read/write options preserve Date cells and raw values";
};
