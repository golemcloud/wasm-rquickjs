import assert from "assert";
import { LRUCache } from "lru-cache";

export const run = async () => {
  let memoCalls = 0;
  let fetchCalls = 0;

  const cache = new LRUCache({
    max: 10,
    memoMethod: (key) => {
      memoCalls += 1;
      return `memo:${key}`;
    },
    fetchMethod: async (key, staleValue, { context }) => {
      fetchCalls += 1;
      assert.strictEqual(staleValue, undefined);
      return `fetch:${key}:${context.suffix}`;
    },
  });

  const memo1 = cache.memo("alpha");
  const memo2 = cache.memo("alpha");
  assert.strictEqual(memo1, "memo:alpha");
  assert.strictEqual(memo2, "memo:alpha");
  assert.strictEqual(memoCalls, 1);

  const fetch1 = await cache.fetch("beta", { context: { suffix: "one" } });
  const fetch2 = await cache.fetch("beta", { context: { suffix: "two" } });
  assert.strictEqual(fetch1, "fetch:beta:one");
  assert.strictEqual(fetch2, "fetch:beta:one");
  assert.strictEqual(fetchCalls, 1);

  return "PASS: memo and fetch cache computed values and avoid duplicate recomputation";
};
