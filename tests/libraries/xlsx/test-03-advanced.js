import assert from "assert";
import * as XLSX from "xlsx";

export const run = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ["a", "b", "sum"],
    [2, 3, null],
  ]);

  ws.C2 = { t: "n", f: "A2+B2", v: 5 };

  const formulae = XLSX.utils.sheet_to_formulae(ws);
  assert(formulae.includes("C2=A2+B2"), `Expected formula list to include C2=A2+B2, got ${formulae.join(",")}`);

  const csv = XLSX.utils.sheet_to_csv(ws);
  assert(csv.includes("a,b,sum"));
  assert(csv.includes("2,3,5"));

  const html = XLSX.utils.sheet_to_html(ws);
  assert(html.includes("<table"));
  assert(html.includes("<td data-t=\"n\" data-v=\"5\" id=\"sjs-C2\">5</td>"));

  return "PASS: Formula, CSV, and HTML exports behave as expected";
};
