import assert from "assert";
import { createOpenAI, openai } from "@ai-sdk/openai";

export const run = () => {
  const provider = createOpenAI({
    apiKey: "test-key",
    baseURL: "https://example.invalid/v1",
    name: "openai-custom",
    headers: {
      "x-test-header": "ok",
    },
  });

  assert.strictEqual(typeof provider, "function");
  assert.strictEqual(typeof provider.chat, "function");
  assert.strictEqual(typeof provider.responses, "function");
  assert.strictEqual(typeof provider.embedding, "function");
  assert.strictEqual(typeof provider.image, "function");
  assert.strictEqual(typeof provider.transcription, "function");
  assert.strictEqual(typeof provider.speech, "function");

  const responsesModel = provider("gpt-4o-mini");
  const chatModel = provider.chat("gpt-4o-mini");
  const embeddingModel = provider.embedding("text-embedding-3-small");

  assert.strictEqual(responsesModel.modelId, "gpt-4o-mini");
  assert.strictEqual(chatModel.modelId, "gpt-4o-mini");
  assert.strictEqual(embeddingModel.modelId, "text-embedding-3-small");

  const defaultModel = openai("gpt-4o-mini");
  assert.strictEqual(defaultModel.modelId, "gpt-4o-mini");

  return "PASS: createOpenAI exposes expected provider factories and model IDs";
};
