import assert from "assert";
import pdf from "pdf-parse";
import { threePagePdf } from "./pdf-fixtures.js";

export const run = async () => {
  const full = await pdf(threePagePdf(), { max: 0 });
  const limited = await pdf(threePagePdf(), { max: 2 });

  assert.strictEqual(full.numpages, 3);
  assert.strictEqual(full.numrender, 3);
  assert.strictEqual(limited.numpages, 3);
  assert.strictEqual(limited.numrender, 2);
  assert.ok(limited.text.includes("Page One"));
  assert.ok(limited.text.includes("Page Two"));
  assert.ok(!limited.text.includes("Page Three"));

  return "PASS: max option limits rendered pages while preserving total pages";
};
