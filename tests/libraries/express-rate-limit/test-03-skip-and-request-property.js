import assert from "assert";
import rateLimit from "express-rate-limit";
import { executeMiddleware } from "./helpers.js";

export const run = async () => {
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 1,
    validate: false,
    keyGenerator: () => "client-skip",
    skip: (req) => req.path === "/health",
    requestPropertyName: "quota",
    standardHeaders: false,
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).send(`quota-exceeded:${req.path}`);
    },
  });

  const skipped = await executeMiddleware(limiter, { path: "/health", url: "/health" });
  assert.strictEqual(skipped.nextCalls, 1);
  assert.strictEqual(skipped.req.quota, undefined);

  const firstRealRequest = await executeMiddleware(limiter, { path: "/api", url: "/api" });
  assert.strictEqual(firstRealRequest.nextCalls, 1);
  assert.strictEqual(firstRealRequest.req.quota.used, 1);
  assert.strictEqual(firstRealRequest.req.quota.remaining, 0);

  const secondRealRequest = await executeMiddleware(limiter, { path: "/api", url: "/api" });
  assert.strictEqual(secondRealRequest.nextCalls, 0);
  assert.strictEqual(secondRealRequest.res.statusCode, 429);
  assert.strictEqual(secondRealRequest.res.body, "quota-exceeded:/api");

  return "PASS: skip and requestPropertyName options behave as expected";
};
