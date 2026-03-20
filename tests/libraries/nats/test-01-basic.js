import assert from "assert";
import { Empty, JSONCodec, StringCodec, createInbox, nuid } from "nats";

export const run = () => {
  const sc = StringCodec();
  const encoded = sc.encode("nats-ready");
  assert.ok(encoded instanceof Uint8Array);
  assert.strictEqual(sc.decode(encoded), "nats-ready");

  const jc = JSONCodec();
  const payload = { topic: "orders", count: 3, ok: true };
  const json = jc.encode(payload);
  assert.deepStrictEqual(jc.decode(json), payload);

  assert.strictEqual(Empty.length, 0);

  const inbox = createInbox();
  assert.ok(inbox.startsWith("_INBOX."));

  const idA = nuid.next();
  const idB = nuid.next();
  assert.ok(idA.length > 10);
  assert.notStrictEqual(idA, idB);

  return "PASS: basic codecs, inbox generation, and NUID creation work";
};
