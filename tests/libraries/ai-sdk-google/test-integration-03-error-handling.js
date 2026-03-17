import assert from "assert";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const run = async () => {
  const provider = createGoogleGenerativeAI({
    apiKey: "test-key",
    baseURL: "http://localhost:18080/v1beta",
  });

  const model = provider("gemini-2.0-flash");

  await assert.rejects(
    () =>
      model.doGenerate({
        prompt: [{ role: "user", content: [{ type: "text", text: "TRIGGER_HTTP_ERROR" }] }],
      }),
    (error) => {
      assert.match(error.message, /invalid x-goog-api-key/i);
      return true;
    },
  );

  return "PASS: API error payloads propagate through the Google provider error handler";
};
