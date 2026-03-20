import assert from "assert";
import * as XLSX from "xlsx";

export const run = () => {
  const ws = XLSX.utils.json_to_sheet([
    { id: 1, name: "Alice" },
    { id: 2 },
  ]);

  XLSX.utils.sheet_add_json(
    ws,
    [{ id: 3, name: "Carol" }],
    { origin: -1, skipHeader: true, header: ["id", "name"] },
  );

  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

  assert.deepStrictEqual(rows, [
    { id: 1, name: "Alice" },
    { id: 2, name: null },
    { id: 3, name: "Carol" },
  ]);

  const decoded = XLSX.utils.decode_range(ws["!ref"]);
  assert.deepStrictEqual(decoded.s, { c: 0, r: 0 });
  assert.deepStrictEqual(decoded.e, { c: 1, r: 3 });

  return "PASS: JSON sheet builders handle defaults and append origins";
};
