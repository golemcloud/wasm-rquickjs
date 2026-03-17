import assert from "assert";
import { google } from "@ai-sdk/google";

export const run = () => {
  const model = google("gemini-2.0-flash");
  const supported = model.supportedUrls["*"];

  assert.ok(Array.isArray(supported));
  assert.ok(supported.length >= 3);

  const matches = (url) => supported.some((pattern) => pattern.test(url));

  assert.ok(matches("https://generativelanguage.googleapis.com/v1beta/files/file-123"));
  assert.ok(matches("https://www.youtube.com/watch?v=abc123xyz"));
  assert.ok(matches("https://youtu.be/abc123xyz?t=90"));
  assert.strictEqual(matches("https://example.com/not-supported"), false);

  assert.throws(
    () => new google("gemini-2.0-flash"),
    (error) => {
      assert.match(error.message, /cannot be called with the new keyword/i);
      return true;
    },
  );

  return "PASS: supported URL patterns and constructor guard behavior are correct";
};
