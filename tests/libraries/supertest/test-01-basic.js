import assert from "assert";
import request from "supertest";

export const run = () => {
  const t = request("http://example.test").get("/health");

  assert.strictEqual(t.method, "GET");
  assert.strictEqual(t.url, "http://example.test/health");
  assert.ok(Array.isArray(t._asserts));

  return "PASS: request(url).get(path) creates a GET test object without server binding";
};
