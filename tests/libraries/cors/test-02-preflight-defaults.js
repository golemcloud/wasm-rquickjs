import assert from "assert";
import cors from "cors";
import { runMiddleware } from "./helpers.js";

export const run = () => {
  const middleware = cors();
  const { res, nextCalled, nextError } = runMiddleware(middleware, {
    method: "OPTIONS",
    headers: {
      origin: "https://client.example",
      "access-control-request-headers": "X-Token,Content-Type",
    },
  });

  assert.strictEqual(nextCalled, 0);
  assert.strictEqual(nextError, undefined);
  assert.strictEqual(res.ended, true);
  assert.strictEqual(res.statusCode, 204);
  assert.strictEqual(res.getHeader("content-length"), "0");
  assert.strictEqual(res.getHeader("access-control-allow-origin"), "*");
  assert.strictEqual(
    res.getHeader("access-control-allow-methods"),
    "GET,HEAD,PUT,PATCH,POST,DELETE"
  );
  assert.strictEqual(
    res.getHeader("access-control-allow-headers"),
    "X-Token,Content-Type"
  );

  const vary = res.getHeader("vary");
  assert.ok(vary && vary.includes("Access-Control-Request-Headers"));

  return "PASS: default preflight reflects requested headers and terminates with 204";
};
