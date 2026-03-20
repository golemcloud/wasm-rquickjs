import assert from "assert";
import compression from "compression";
import { decodeBody, runCompressionScenario } from "./helpers.js";

const customFilter = (req, res) => {
  if (req.headers["x-no-compression"]) {
    return false;
  }

  return compression.filter(req, res);
};

export const run = async () => {
  const payload = "custom filter and enforceEncoding coverage";

  const blockedMiddleware = compression({
    threshold: 0,
    enforceEncoding: "gzip",
    filter: customFilter,
  });

  const blocked = await runCompressionScenario({
    middleware: blockedMiddleware,
    reqHeaders: { "x-no-compression": "true" },
    resHeaders: {
      "content-type": "text/plain",
      "content-length": String(Buffer.byteLength(payload)),
    },
    body: payload,
  });

  assert.strictEqual(blocked.headers["content-encoding"], undefined);
  assert.strictEqual(decodeBody(blocked), payload);

  const forcedMiddleware = compression({
    threshold: 0,
    enforceEncoding: "gzip",
  });

  const forced = await runCompressionScenario({
    middleware: forcedMiddleware,
    reqHeaders: {},
    resHeaders: {
      "content-type": "text/plain",
      "content-length": String(Buffer.byteLength(payload)),
    },
    body: payload,
  });

  assert.strictEqual(forced.headers["content-encoding"], "gzip");
  assert.strictEqual(decodeBody(forced), payload);

  return "PASS: custom filter opt-out works and enforceEncoding applies without accept-encoding";
};
