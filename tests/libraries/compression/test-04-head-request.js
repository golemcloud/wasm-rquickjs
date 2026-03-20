import assert from "assert";
import compression from "compression";
import { runCompressionScenario } from "./helpers.js";

export const run = async () => {
  const middleware = compression({ threshold: 0 });

  const result = await runCompressionScenario({
    middleware,
    method: "HEAD",
    reqHeaders: { "accept-encoding": "gzip" },
    resHeaders: {
      "content-type": "text/plain",
      "content-length": "32",
    },
    body: "head response body",
  });

  assert.strictEqual(result.headers["content-encoding"], undefined);
  assert.ok(Buffer.isBuffer(result.body));

  return "PASS: skips compression for HEAD requests";
};
