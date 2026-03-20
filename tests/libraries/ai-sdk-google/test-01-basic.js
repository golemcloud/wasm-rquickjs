import assert from "assert";
import { VERSION, createGoogleGenerativeAI, google } from "@ai-sdk/google";

export const run = () => {
  const provider = createGoogleGenerativeAI({
    apiKey: "test-api-key",
    baseURL: "https://example.invalid/v1beta",
    headers: {
      "x-test-header": "ok",
    },
    name: "google.custom",
  });

  assert.strictEqual(typeof provider, "function");
  assert.strictEqual(provider.specificationVersion, "v3");

  const direct = provider("gemini-2.0-flash");
  const chat = provider.chat("gemini-2.0-flash");
  const language = provider.languageModel("gemini-2.0-flash");
  const generative = provider.generativeAI("gemini-2.0-flash");

  assert.strictEqual(direct.modelId, "gemini-2.0-flash");
  assert.strictEqual(chat.modelId, "gemini-2.0-flash");
  assert.strictEqual(language.modelId, "gemini-2.0-flash");
  assert.strictEqual(generative.modelId, "gemini-2.0-flash");
  assert.strictEqual(direct.provider, "google.custom");
  assert.strictEqual(direct.specificationVersion, "v3");

  const embedding = provider.embedding("gemini-embedding-001");
  const textEmbedding = provider.textEmbedding("gemini-embedding-001");
  assert.strictEqual(embedding.modelId, "gemini-embedding-001");
  assert.strictEqual(textEmbedding.modelId, "gemini-embedding-001");
  assert.strictEqual(embedding.maxEmbeddingsPerCall, 2048);

  const image = provider.image("imagen-4.0-generate-001");
  const video = provider.video("veo-2.0-generate-001");
  assert.strictEqual(image.modelId, "imagen-4.0-generate-001");
  assert.strictEqual(video.modelId, "veo-2.0-generate-001");

  const defaultModel = google("gemini-2.0-flash");
  assert.strictEqual(defaultModel.provider, "google.generative-ai");

  assert.strictEqual(typeof VERSION, "string");
  assert.ok(VERSION.length > 0);

  return "PASS: provider factories, aliases, and model constructors expose expected metadata";
};
