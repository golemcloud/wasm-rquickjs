import assert from "assert";
import compression from "compression";
import { decodeBody, runCompressionScenario } from "./helpers.js";

export const run = async () => {
  const middleware = compression({ threshold: 0 });
  const payload = "cache-control no-transform should bypass compression";

  const result = await runCompressionScenario({
    middleware,
    reqHeaders: { "accept-encoding": "gzip" },
    resHeaders: {
      "content-type": "text/plain",
      "cache-control": "public, max-age=60, no-transform",
      "content-length": String(Buffer.byteLength(payload)),
    },
    body: payload,
  });

  assert.strictEqual(result.headers["content-encoding"], undefined);
  assert.strictEqual(decodeBody(result), payload);

  return "PASS: honors cache-control no-transform and leaves body uncompressed";
};
