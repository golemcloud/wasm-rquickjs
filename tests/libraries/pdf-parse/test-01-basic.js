import assert from "assert";
import pdf from "pdf-parse";
import { singlePagePdf } from "./pdf-fixtures.js";

export const run = async () => {
  const data = await pdf(singlePagePdf());

  assert.strictEqual(typeof data.numpages, "number");
  assert.strictEqual(typeof data.numrender, "number");
  assert.strictEqual(typeof data.text, "string");
  assert.strictEqual(typeof data.version, "string");
  assert.ok("info" in data);
  assert.ok("metadata" in data);
  assert.ok(data.text.includes("Hello PDF Parse"), `Expected extracted text, got: ${data.text}`);

  return "PASS: Basic parsing returns expected shape and text";
};
