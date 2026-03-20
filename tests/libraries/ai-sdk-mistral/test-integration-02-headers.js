import assert from "assert";
import { createMistral } from "@ai-sdk/mistral";

export const run = async () => {
  const provider = createMistral({
    apiKey: "test-key",
    baseURL: "http://localhost:18080/v1",
    headers: {
      "x-extra-header": "present",
    },
  });

  const model = provider("mistral-small-latest");
  const result = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "CHECK_HEADERS" }] }],
  });

  assert.strictEqual(result.content[0].type, "text");
  assert.strictEqual(result.content[0].text, "HEADERS_OK");

  return "PASS: doGenerate forwards authorization and custom headers over HTTP";
};
