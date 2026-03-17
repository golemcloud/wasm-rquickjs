import assert from "assert";
import { VERSION, anthropic, createAnthropic } from "@ai-sdk/anthropic";

export const run = () => {
  const provider = createAnthropic({
    apiKey: "test-key",
    baseURL: "https://api.example.test/v1",
    name: "anthropic-custom",
    headers: {
      "x-test-header": "ok",
    },
  });

  assert.strictEqual(typeof provider, "function");
  assert.strictEqual(typeof provider.chat, "function");
  assert.strictEqual(typeof provider.languageModel, "function");
  assert.strictEqual(typeof provider.messages, "function");

  const directModel = provider("claude-3-haiku-20240307");
  const chatModel = provider.chat("claude-3-haiku-20240307");
  const languageModel = provider.languageModel("claude-3-haiku-20240307");
  const messagesModel = provider.messages("claude-3-haiku-20240307");

  assert.strictEqual(directModel.modelId, "claude-3-haiku-20240307");
  assert.strictEqual(chatModel.modelId, "claude-3-haiku-20240307");
  assert.strictEqual(languageModel.modelId, "claude-3-haiku-20240307");
  assert.strictEqual(messagesModel.modelId, "claude-3-haiku-20240307");
  assert.strictEqual(directModel.specificationVersion, "v3");

  const defaultModel = anthropic("claude-3-haiku-20240307");
  assert.strictEqual(defaultModel.modelId, "claude-3-haiku-20240307");

  assert.strictEqual(typeof VERSION, "string");
  assert.ok(VERSION.length > 0);

  return "PASS: createAnthropic exposes expected factories, aliases, and package metadata";
};
