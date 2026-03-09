import assert from "assert";
import request from "supertest";

export const run = () => {
  const t = request("http://example.test").get("/status");

  assert.strictEqual(t._assertStatus(204, { status: 204 }), undefined);
  assert.strictEqual(t._assertStatusArray([200, 201, 202], { status: 202 }), undefined);

  const statusError = t._assertStatus(200, { status: 500 });
  assert.ok(statusError instanceof Error);
  assert.ok(statusError.message.includes("expected 200"));

  const arrayError = t._assertStatusArray([200, 201], { status: 418 });
  assert.ok(arrayError instanceof Error);
  assert.ok(arrayError.message.includes("expected one of"));

  return "PASS: status assertion helpers return undefined for pass and Error for mismatch";
};
