import assert from "assert";
import { createMistral } from "@ai-sdk/mistral";

const expectNoSuchModelError = (fn) => {
  assert.throws(fn, /NoSuchModelError|No such model|not supported/i);
};

export const run = () => {
  const provider = createMistral({ apiKey: "test-key" });

  expectNoSuchModelError(() => provider.imageModel("pixtral-large-latest"));

  if (typeof provider.textEmbedding === "function") {
    const model = provider.textEmbedding("mistral-embed");
    assert.strictEqual(model.modelId, "mistral-embed");
  }

  if (typeof provider.textEmbeddingModel === "function") {
    const model = provider.textEmbeddingModel("mistral-embed");
    assert.strictEqual(model.modelId, "mistral-embed");
  }

  return "PASS: createMistral rejects unsupported image models and keeps embedding aliases working";
};
