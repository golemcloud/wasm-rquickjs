import assert from "assert";
import { LRUCache } from "lru-cache";

export const run = () => {
  const cache = new LRUCache({
    max: 10,
    maxSize: 5,
    sizeCalculation: (value) => value.length,
  });

  cache.set("a", "12");
  cache.set("b", "345");
  assert.strictEqual(cache.calculatedSize, 5);

  cache.set("c", "9");

  assert.strictEqual(cache.has("a"), false);
  assert.strictEqual(cache.get("b"), "345");
  assert.strictEqual(cache.get("c"), "9");
  assert.strictEqual(cache.calculatedSize, 4);

  return "PASS: maxSize and sizeCalculation trigger LRU eviction by total size";
};
