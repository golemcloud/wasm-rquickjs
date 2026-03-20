import assert from "assert";
import pdf from "pdf-parse";
import { threePagePdf } from "./pdf-fixtures.js";

export const run = async () => {
  const data = await pdf(threePagePdf(), {
    pagerender: async () => "CUSTOM-PAGE-TEXT",
  });

  const occurrences = (data.text.match(/CUSTOM-PAGE-TEXT/g) || []).length;
  assert.strictEqual(occurrences, 3, `Expected 3 custom render occurrences, got ${occurrences}`);
  assert.ok(!data.text.includes("Page One"));

  return "PASS: custom pagerender output is used for each page";
};
