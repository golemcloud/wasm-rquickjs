import assert from "assert";
import { InMemoryCache } from "@langchain/core/caches";
import { Document } from "@langchain/core/documents";
import { cosineSimilarity, maximalMarginalRelevance } from "@langchain/core/utils/math";

export const run = async () => {
  const doc = new Document({
    pageContent: "LangChain Core enables composable AI workflows.",
    metadata: { source: "unit-test" },
    id: "doc-1",
  });

  assert.strictEqual(doc.id, "doc-1");
  assert.strictEqual(doc.metadata.source, "unit-test");

  const cache = new InMemoryCache();
  const cacheValue = [{ text: "cached-response" }];
  await cache.update("prompt", "llm-key", cacheValue);
  const cacheHit = await cache.lookup("prompt", "llm-key");
  assert.deepStrictEqual(cacheHit, cacheValue);

  const similarities = cosineSimilarity([[1, 0], [0, 1]], [[1, 0], [0, 1]]);
  assert.strictEqual(similarities[0][0], 1);
  assert.strictEqual(similarities[1][1], 1);

  const selected = maximalMarginalRelevance([1, 0], [[1, 0], [0.9, 0.1], [0, 1]], 0.5, 2);
  assert.strictEqual(selected.length, 2);
  assert.strictEqual(selected[0], 0);

  return "PASS: document construction, cache operations, and vector math utilities work";
};
