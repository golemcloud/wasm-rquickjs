import assert from "assert";
import { createMistral } from "@ai-sdk/mistral";

export const run = async () => {
  const provider = createMistral({
    apiKey: "test-key",
    baseURL: "http://localhost:18080/v1",
  });

  const model = provider("mistral-small-latest");
  const result = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "PING" }] }],
  });

  assert.strictEqual(result.content[0].type, "text");
  assert.strictEqual(result.content[0].text, "HTTP_MOCK:PING");

  return "PASS: doGenerate performs an HTTP request against the mock Mistral endpoint";
};
