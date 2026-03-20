import assert from "assert";
import rateLimit from "express-rate-limit";
import { executeMiddleware } from "./helpers.js";

export const run = async () => {
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 1,
    validate: false,
    keyGenerator: () => "client-over-limit",
    message: "Slow down",
    standardHeaders: false,
    legacyHeaders: false,
    handler(req, res, _next, options) {
      res.status(options.statusCode).send(`blocked:${options.message}`);
    },
  });

  const first = await executeMiddleware(limiter);
  assert.strictEqual(first.nextCalls, 1);
  assert.strictEqual(first.req.rateLimit.remaining, 0);

  const second = await executeMiddleware(limiter);
  assert.strictEqual(second.nextCalls, 0);
  assert.strictEqual(second.res.statusCode, 429);
  assert.strictEqual(second.res.body, "blocked:Slow down");
  assert.strictEqual(second.req.rateLimit.used, 2);
  assert.strictEqual(second.req.rateLimit.remaining, 0);

  return "PASS: custom handler runs when limit is exceeded";
};
