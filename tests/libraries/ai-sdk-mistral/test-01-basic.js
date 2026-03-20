import assert from "assert";
import { VERSION, createMistral, mistral } from "@ai-sdk/mistral";

export const run = () => {
  const provider = createMistral({
    apiKey: "test-key",
    baseURL: "https://api.example.test/v1",
    headers: {
      "x-test-header": "ok",
    },
  });

  assert.strictEqual(typeof provider, "function");
  assert.strictEqual(typeof provider.chat, "function");
  assert.strictEqual(typeof provider.languageModel, "function");
  assert.strictEqual(typeof provider.embedding, "function");
  assert.strictEqual(typeof provider.embeddingModel, "function");
  assert.strictEqual(typeof provider.imageModel, "function");

  const directModel = provider("mistral-small-latest");
  const chatModel = provider.chat("mistral-small-latest");
  const languageModel = provider.languageModel("mistral-small-latest");
  const embeddingModel = provider.embedding("mistral-embed");

  assert.strictEqual(directModel.modelId, "mistral-small-latest");
  assert.strictEqual(chatModel.modelId, "mistral-small-latest");
  assert.strictEqual(languageModel.modelId, "mistral-small-latest");
  assert.strictEqual(embeddingModel.modelId, "mistral-embed");
  assert.strictEqual(directModel.specificationVersion, "v3");

  const defaultModel = mistral("mistral-small-latest");
  assert.strictEqual(defaultModel.modelId, "mistral-small-latest");

  assert.strictEqual(typeof VERSION, "string");
  assert.ok(VERSION.length > 0);

  return "PASS: createMistral exposes expected factories, aliases, and package metadata";
};
