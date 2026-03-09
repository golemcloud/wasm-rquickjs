import assert from "assert";
import { MsgHdrsImpl, canonicalMIMEHeaderKey, headers } from "nats";

export const run = () => {
  const h = headers(503, "slow down");
  h.set("x-trace-id", "abc");
  h.append("x-trace-id", "def");
  h.set("content-type", "application/json");

  assert.strictEqual(canonicalMIMEHeaderKey("content-type"), "Content-Type");
  assert.strictEqual(h.code, 503);
  assert.strictEqual(h.description, "slow down");
  assert.deepStrictEqual(h.values("x-trace-id"), ["abc", "def"]);
  assert.strictEqual(h.get("content-type"), "application/json");

  const wire = h.encode();
  assert.ok(new TextDecoder().decode(wire).includes("NATS/1.0 503 slow down"));
  const decoded = MsgHdrsImpl.decode(wire);

  assert.strictEqual(decoded.code, 503);
  assert.strictEqual(decoded.description, "slow down");
  assert.deepStrictEqual(decoded.values("x-trace-id"), ["abc", "def"]);
  assert.ok(decoded.has("content-type"));

  return "PASS: header canonicalization and wire encode/decode work";
};
