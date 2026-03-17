import assert from "assert";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const run = async () => {
  const provider = createGoogleGenerativeAI({
    apiKey: "test-key",
    baseURL: "http://localhost:18080/v1beta",
    headers: {
      "x-extra-header": "present",
    },
  });

  const model = provider("gemini-2.0-flash");
  const result = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "CHECK_HEADERS" }] }],
  });

  assert.strictEqual(result.content[0].text, "HEADERS_OK");

  return "PASS: x-goog-api-key and custom headers are sent over real HTTP transport";
};
