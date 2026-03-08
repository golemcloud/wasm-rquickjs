import assert from "assert";
import { LRUCache } from "lru-cache";

export const run = () => {
  const calls = [];
  const cache = new LRUCache({
    max: 2,
    dispose: (value, key, reason) => {
      calls.push(`dispose:${key}:${reason}:${value}`);
    },
    disposeAfter: (value, key, reason) => {
      calls.push(`disposeAfter:${key}:${reason}:${value}`);
    },
  });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);
  cache.delete("b");

  assert.deepStrictEqual(calls, [
    "dispose:a:evict:1",
    "disposeAfter:a:evict:1",
    "dispose:b:delete:2",
    "disposeAfter:b:delete:2",
  ]);

  return "PASS: dispose and disposeAfter are called with correct reasons";
};
