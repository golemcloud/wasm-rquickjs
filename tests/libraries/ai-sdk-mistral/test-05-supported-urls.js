import assert from "assert";
import { createMistral } from "@ai-sdk/mistral";

export const run = () => {
  const provider = createMistral({ apiKey: "test-key" });
  const model = provider("mistral-small-latest");

  assert.strictEqual(typeof model.supportedUrls, "object");
  const pdfMatchers = model.supportedUrls["application/pdf"];
  assert.ok(Array.isArray(pdfMatchers));
  assert.ok(pdfMatchers.length > 0);

  const httpsPdf = "https://example.com/file.pdf";
  const ftpPdf = "ftp://example.com/file.pdf";
  assert.strictEqual(pdfMatchers.some((re) => re.test(httpsPdf)), true);
  assert.strictEqual(pdfMatchers.some((re) => re.test(ftpPdf)), false);

  return "PASS: mistral model supportedUrls exposes HTTPS-only URL matchers for PDFs";
};
