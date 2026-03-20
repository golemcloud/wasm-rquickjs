import assert from "assert";
import compression from "compression";
import { decodeBody, runCompressionScenario } from "./helpers.js";

export const run = async () => {
  const middleware = compression({ threshold: 0 });
  const payload = "compression middleware should gzip this text";

  const result = await runCompressionScenario({
    middleware,
    reqHeaders: { "accept-encoding": "gzip, deflate" },
    resHeaders: {
      "content-type": "text/plain; charset=utf-8",
      "content-length": String(Buffer.byteLength(payload)),
    },
    body: payload,
  });

  assert.strictEqual(result.headers["content-encoding"], "gzip");
  assert.match(String(result.headers.vary), /Accept-Encoding/i);
  assert.strictEqual(decodeBody(result), payload);

  return "PASS: applies gzip compression for compressible payloads";
};
