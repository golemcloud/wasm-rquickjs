import assert from "assert";
import rateLimit from "express-rate-limit";
import { executeMiddleware } from "./helpers.js";

export const run = async () => {
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 2,
    validate: false,
    keyGenerator: () => "client-basic",
    standardHeaders: false,
    legacyHeaders: true,
  });

  const first = await executeMiddleware(limiter);
  assert.strictEqual(first.nextCalls, 1);
  assert.strictEqual(first.nextError, undefined);
  assert.strictEqual(first.req.rateLimit.limit, 2);
  assert.strictEqual(first.req.rateLimit.used, 1);
  assert.strictEqual(first.req.rateLimit.remaining, 1);
  assert.ok(first.req.rateLimit.resetTime instanceof Date);
  assert.strictEqual(Number(first.res.getHeader("x-ratelimit-limit")), 2);
  assert.strictEqual(Number(first.res.getHeader("x-ratelimit-remaining")), 1);

  const second = await executeMiddleware(limiter);
  assert.strictEqual(second.nextCalls, 1);
  assert.strictEqual(second.req.rateLimit.used, 2);
  assert.strictEqual(second.req.rateLimit.remaining, 0);
  assert.strictEqual(Number(second.res.getHeader("x-ratelimit-remaining")), 0);

  return "PASS: limiter tracks requests and sets legacy headers";
};
