import assert from "assert";
import compression from "compression";
import { decodeBody, runCompressionScenario } from "./helpers.js";

export const run = async () => {
  const middleware = compression({ threshold: "1kb" });
  const payload = "small body";

  const result = await runCompressionScenario({
    middleware,
    reqHeaders: { "accept-encoding": "gzip" },
    resHeaders: {
      "content-type": "text/plain",
      "content-length": String(Buffer.byteLength(payload)),
    },
    body: payload,
  });

  assert.strictEqual(result.headers["content-encoding"], undefined);
  assert.strictEqual(decodeBody(result), payload);

  return "PASS: skips compression for bodies smaller than threshold";
};
