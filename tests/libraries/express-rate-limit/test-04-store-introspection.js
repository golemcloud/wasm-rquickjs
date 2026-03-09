import assert from "assert";
import rateLimit, { MemoryStore } from "express-rate-limit";
import { executeMiddleware } from "./helpers.js";

export const run = async () => {
  const store = new MemoryStore();

  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 3,
    validate: false,
    keyGenerator: () => "client-store",
    store,
    standardHeaders: false,
    legacyHeaders: false,
  });

  const first = await executeMiddleware(limiter);
  assert.strictEqual(first.nextCalls, 1);

  const infoAfterFirstHit = await limiter.getKey("client-store");
  assert.ok(infoAfterFirstHit);
  assert.strictEqual(infoAfterFirstHit.totalHits, 1);
  assert.ok(infoAfterFirstHit.resetTime instanceof Date);

  await limiter.resetKey("client-store");

  const infoAfterReset = await limiter.getKey("client-store");
  assert.strictEqual(infoAfterReset, undefined);

  return "PASS: limiter.getKey and limiter.resetKey delegate to the store";
};
