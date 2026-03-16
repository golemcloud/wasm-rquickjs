import assert from "assert";
import { connect } from "nats";

export const run = async () => {
  const nc = await connect({ servers: "nats://127.0.0.1:4223" });

  const info = nc.info;
  assert.ok(info, "server info should be available after connect");
  assert.ok(info.port > 0, "server info should contain a valid port");
  assert.ok(info.max_payload > 0, "server info should contain max_payload");

  assert.strictEqual(nc.isClosed(), false, "connection should not be closed");
  assert.strictEqual(nc.isDraining(), false, "connection should not be draining");

  await nc.drain();
  assert.strictEqual(nc.isClosed(), true, "connection should be closed after drain");

  return "PASS: connect, get server info, drain/close";
};
