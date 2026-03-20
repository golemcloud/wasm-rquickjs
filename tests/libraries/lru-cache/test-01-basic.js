import assert from "assert";
import { LRUCache } from "lru-cache";

export const run = () => {
  const cache = new LRUCache({ max: 2 });

  cache.set("a", 1);
  cache.set("b", 2);
  assert.strictEqual(cache.get("a"), 1);

  cache.set("c", 3);
  assert.strictEqual(cache.has("a"), true);
  assert.strictEqual(cache.has("b"), false);
  assert.strictEqual(cache.get("c"), 3);

  return "PASS: set/get updates recency and evicts least-recently-used entries";
};
