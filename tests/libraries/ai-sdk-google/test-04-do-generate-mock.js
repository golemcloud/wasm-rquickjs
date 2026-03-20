import assert from "assert";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const run = async () => {
  let requestUrl = "";
  let requestBody = null;
  let apiKeyHeader = "";
  let extraHeader = "";

  const provider = createGoogleGenerativeAI({
    apiKey: "test-key",
    baseURL: "https://api.example.test/v1beta",
    headers: {
      "x-extra-header": "present",
    },
    fetch: async (url, init) => {
      requestUrl = String(url);
      const headers = new Headers(init?.headers);
      apiKeyHeader = headers.get("x-goog-api-key") || "";
      extraHeader = headers.get("x-extra-header") || "";
      requestBody = JSON.parse(String(init?.body || "{}"));

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                role: "model",
                parts: [{ text: "MOCK_GENERATE_OK" }],
              },
              finishReason: "STOP",
              index: 0,
              safetyRatings: [],
            },
          ],
          usageMetadata: {
            promptTokenCount: 3,
            candidatesTokenCount: 1,
            totalTokenCount: 4,
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    },
  });

  const model = provider("gemini-2.0-flash");
  const result = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "Reply with MOCK_GENERATE_OK" }] }],
    maxTokens: 8,
    temperature: 0,
  });

  assert.strictEqual(requestUrl, "https://api.example.test/v1beta/models/gemini-2.0-flash:generateContent");
  assert.strictEqual(apiKeyHeader, "test-key");
  assert.strictEqual(extraHeader, "present");
  assert.strictEqual(requestBody.contents[0].parts[0].text, "Reply with MOCK_GENERATE_OK");
  assert.strictEqual(result.content[0].type, "text");
  assert.strictEqual(result.content[0].text, "MOCK_GENERATE_OK");
  assert.strictEqual(result.usage.inputTokens.total, 3);
  assert.strictEqual(result.usage.outputTokens.total, 1);

  return "PASS: doGenerate sends expected request and parses mocked Gemini response";
};
