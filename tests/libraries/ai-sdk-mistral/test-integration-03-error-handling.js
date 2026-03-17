import assert from "assert";
import { createMistral } from "@ai-sdk/mistral";

export const run = async () => {
  const provider = createMistral({
    apiKey: "test-key",
    baseURL: "http://localhost:18080/v1",
  });

  const model = provider("mistral-small-latest");

  await assert.rejects(
    () =>
      model.doGenerate({
        prompt: [{ role: "user", content: [{ type: "text", text: "TRIGGER_HTTP_ERROR" }] }],
      }),
    /invalid api key|401|Mistral/i,
  );

  return "PASS: doGenerate surfaces API errors from the mock Mistral endpoint";
};
