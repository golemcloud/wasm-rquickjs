import assert from "assert";
import redisModule from "redis";

const redis = redisModule.default ?? redisModule;

export const run = async () => {
  let message = "";
  try {
    await redis.digest("hello-world");
    assert.fail("digest should throw when @node-rs/xxhash is not installed");
  } catch (error) {
    message = String(error.message || error);
  }

  assert.ok(message.includes("@node-rs/xxhash"));
  assert.ok(message.includes("requires"));

  return "PASS: digest reports missing optional @node-rs/xxhash dependency clearly";
};
