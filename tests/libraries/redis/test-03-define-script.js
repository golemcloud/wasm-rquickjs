import assert from "assert";
import redisModule from "redis";

const redis = redisModule.default ?? redisModule;

export const run = () => {
  const script = redis.defineScript({
    NUMBER_OF_KEYS: 1,
    SCRIPT: "return ARGV[1]",
    transformArguments(key, value) {
      return [key, value];
    },
    transformReply(reply) {
      return reply;
    },
  });

  assert.strictEqual(script.NUMBER_OF_KEYS, 1);
  assert.strictEqual(script.SCRIPT, "return ARGV[1]");
  assert.ok(/^[a-f0-9]{40}$/.test(script.SHA1));
  assert.deepStrictEqual(script.transformArguments("k", "v"), ["k", "v"]);

  const sameScript = redis.defineScript({
    SCRIPT: "return ARGV[1]",
    transformArguments(arg) {
      return [arg];
    },
    transformReply(reply) {
      return reply;
    },
  });
  assert.strictEqual(sameScript.SHA1, script.SHA1);

  return "PASS: defineScript computes stable SHA1 and keeps script metadata";
};
