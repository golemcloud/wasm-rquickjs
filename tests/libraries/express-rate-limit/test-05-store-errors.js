import assert from "assert";
import rateLimit from "express-rate-limit";
import { executeMiddleware } from "./helpers.js";

class FailingStore {
  init() {}

  async increment() {
    throw new Error("store exploded");
  }

  async decrement() {}

  async resetKey() {}
}

export const run = async () => {
  const permissiveLimiter = rateLimit({
    windowMs: 60_000,
    limit: 1,
    validate: false,
    passOnStoreError: true,
    keyGenerator: () => "client-error",
    store: new FailingStore(),
    standardHeaders: false,
    legacyHeaders: false,
  });

  const permissiveResult = await executeMiddleware(permissiveLimiter);
  assert.strictEqual(permissiveResult.nextCalls, 1);
  assert.strictEqual(permissiveResult.nextError, undefined);

  const strictLimiter = rateLimit({
    windowMs: 60_000,
    limit: 1,
    validate: false,
    passOnStoreError: false,
    keyGenerator: () => "client-error",
    store: new FailingStore(),
    standardHeaders: false,
    legacyHeaders: false,
  });

  const strictResult = await executeMiddleware(strictLimiter);
  assert.strictEqual(strictResult.nextCalls, 1);
  assert.ok(strictResult.nextError instanceof Error);
  assert.strictEqual(strictResult.nextError.message, "store exploded");

  return "PASS: passOnStoreError controls middleware behavior on store failures";
};
