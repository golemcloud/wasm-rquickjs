import assert from "assert";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const run = async () => {
  const provider = createGoogleGenerativeAI({
    apiKey: "test-key",
    baseURL: "http://localhost:18080/v1beta",
  });

  const model = provider("gemini-2.0-flash");
  const result = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "PING" }] }],
  });

  assert.strictEqual(result.content[0].type, "text");
  assert.strictEqual(result.content[0].text, "HTTP_MOCK:PING");

  return "PASS: doGenerate performs an HTTP request against the mock Gemini endpoint";
};
