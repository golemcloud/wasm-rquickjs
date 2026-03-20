import assert from "assert";
import request from "supertest";

export const run = () => {
  const t = request("http://example.test").post("/submit")
    .expect(201)
    .expect("content-type", /json/)
    .expect({ ok: true });

  assert.strictEqual(t._asserts.length, 3);

  t.assert(null, {
    status: 201,
    body: { ok: true },
    header: { "content-type": "application/json; charset=utf-8" },
    text: "",
    req: { getHeader: () => null },
  }, (err) => {
    if (err) throw err;
  });

  return "PASS: expect() chain queues assertions and assert() validates synthetic response";
};
