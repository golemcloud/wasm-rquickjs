import assert from "assert";
import { createAnthropic } from "@ai-sdk/anthropic";

export const run = () => {
  const provider = createAnthropic({ apiKey: "test-key" });
  const model = provider("claude-3-haiku-20240307");

  assert.strictEqual(typeof model.supportsUrl, "function");
  assert.strictEqual(model.supportsUrl(new URL("https://example.com/image.png")), true);
  assert.strictEqual(model.supportsUrl(new URL("https://example.com/document.pdf")), true);
  assert.strictEqual(model.supportsUrl(new URL("ftp://example.com/file.bin")), false);

  assert.strictEqual(typeof model.supportedUrls, "object");
  assert.ok(Array.isArray(model.supportedUrls["image/*"]));
  assert.ok(Array.isArray(model.supportedUrls["application/pdf"]));

  return "PASS: anthropic model URL capability helpers expose expected protocols and MIME groups";
};
