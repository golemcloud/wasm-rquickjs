import assert from "assert";
import request from "supertest";

export const run = () => {
  const t = request("http://example.test").get("/payload");

  assert.strictEqual(
    t._assertBody({ value: 42 }, { body: { value: 42 }, text: "" }),
    undefined,
  );
  assert.strictEqual(
    t._assertBody(/hello/, { body: null, text: "hello world" }),
    undefined,
  );
  assert.strictEqual(
    t._assertHeader({ name: "content-type", value: /json/ }, { header: { "content-type": "application/json" } }),
    undefined,
  );

  const bodyErr = t._assertBody({ value: 7 }, { body: { value: 8 }, text: "" });
  assert.ok(bodyErr instanceof Error);
  assert.ok(bodyErr.message.includes("expected"));

  const headerErr = t._assertHeader({ name: "x-token", value: "abc" }, { header: {} });
  assert.ok(headerErr instanceof Error);
  assert.ok(headerErr.message.includes("expected \"x-token\" header field"));

  return "PASS: body and header helper assertions work for matching and mismatch cases";
};
