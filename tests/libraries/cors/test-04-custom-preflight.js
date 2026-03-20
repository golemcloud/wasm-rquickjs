import assert from "assert";
import cors from "cors";
import { runMiddleware } from "./helpers.js";

export const run = () => {
  const middleware = cors({
    origin: /\.example\.com$/,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Trace-Id"],
    maxAge: 600,
  });

  const { res, nextCalled, nextError } = runMiddleware(middleware, {
    method: "OPTIONS",
    headers: {
      origin: "https://api.example.com",
      "access-control-request-headers": "X-Ignored",
    },
  });

  assert.strictEqual(nextCalled, 0);
  assert.strictEqual(nextError, undefined);
  assert.strictEqual(res.ended, true);
  assert.strictEqual(res.statusCode, 204);
  assert.strictEqual(res.getHeader("access-control-allow-origin"), "https://api.example.com");
  assert.strictEqual(res.getHeader("access-control-allow-methods"), "GET,POST,DELETE");
  assert.strictEqual(res.getHeader("access-control-allow-headers"), "Content-Type,Authorization");
  assert.strictEqual(res.getHeader("access-control-expose-headers"), "X-Trace-Id");
  assert.strictEqual(res.getHeader("access-control-max-age"), "600");
  assert.ok(res.getHeader("vary")?.includes("Origin"));

  return "PASS: preflight uses explicit methods/headers/exposed/maxAge options";
};
