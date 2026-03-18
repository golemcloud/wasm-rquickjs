import assert from "assert";
import pdf from "pdf-parse";
import { singlePagePdf } from "./pdf-fixtures.js";

export const run = async () => {
  const data = await pdf(singlePagePdf(), { version: "v2.0.550" });

  assert.strictEqual(typeof data.version, "string");
  assert.ok(data.version.includes("2.0.550"), `Expected version to include 2.0.550, got ${data.version}`);

  return "PASS: version option selects the requested bundled pdf.js build";
};
