import assert from "assert";
import cors from "cors";
import { runMiddleware } from "./helpers.js";

export const run = () => {
  const allowedOrigins = new Set([
    "https://app.example",
    "https://admin.example",
  ]);

  const middleware = cors({
    origin: (origin, callback) => {
      callback(null, Boolean(origin && allowedOrigins.has(origin)));
    },
    credentials: true,
  });

  const allowed = runMiddleware(middleware, {
    method: "GET",
    headers: {
      origin: "https://app.example",
    },
  });

  assert.strictEqual(allowed.nextCalled, 1);
  assert.strictEqual(allowed.nextError, undefined);
  assert.strictEqual(allowed.res.getHeader("access-control-allow-origin"), "https://app.example");
  assert.strictEqual(allowed.res.getHeader("access-control-allow-credentials"), "true");
  assert.ok(allowed.res.getHeader("vary")?.includes("Origin"));

  const denied = runMiddleware(middleware, {
    method: "GET",
    headers: {
      origin: "https://attacker.example",
    },
  });

  assert.strictEqual(denied.nextCalled, 1);
  assert.strictEqual(denied.nextError, undefined);
  assert.strictEqual(denied.res.getHeader("access-control-allow-origin"), undefined);
  assert.strictEqual(denied.res.getHeader("access-control-allow-credentials"), undefined);
  assert.strictEqual(denied.res.getHeader("vary"), undefined);

  return "PASS: dynamic origin callback reflects allowed origins and omits disallowed origin header";
};
