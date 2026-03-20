import assert from "assert";
import { createAnthropic } from "@ai-sdk/anthropic";

const expectNoSuchModelError = (fn) => {
  assert.throws(fn, /NoSuchModelError|No such model|not supported/i);
};

export const run = () => {
  assert.throws(
    () => createAnthropic({ apiKey: "key-a", authToken: "token-b" }),
    /Both apiKey and authToken were provided/i,
  );

  const provider = createAnthropic({ apiKey: "test-key" });
  if (typeof provider.embeddingModel === "function") {
    expectNoSuchModelError(() => provider.embeddingModel("text-embedding-3-small"));
  }

  if (typeof provider.textEmbeddingModel === "function") {
    expectNoSuchModelError(() => provider.textEmbeddingModel("text-embedding-3-small"));
  }

  if (typeof provider.imageModel === "function") {
    expectNoSuchModelError(() => provider.imageModel("claude-image-1"));
  }

  return "PASS: createAnthropic validates constructor options and rejects unsupported model kinds";
};
