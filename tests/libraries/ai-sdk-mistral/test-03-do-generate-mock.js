import assert from "assert";
import { createMistral } from "@ai-sdk/mistral";

export const run = async () => {
  let requestUrl = "";
  let requestBody = null;
  let authHeader = "";
  let extraHeader = "";

  const provider = createMistral({
    apiKey: "test-key",
    baseURL: "https://api.example.test/v1",
    headers: {
      "x-extra-header": "present",
    },
    fetch: async (url, init) => {
      requestUrl = String(url);
      const headers = new Headers(init?.headers);
      authHeader = headers.get("authorization") || "";
      extraHeader = headers.get("x-extra-header") || "";
      requestBody = JSON.parse(String(init?.body || "{}"));

      return new Response(
        JSON.stringify({
          id: "chatcmpl-test",
          object: "chat.completion",
          model: "mistral-small-latest",
          created: 1730000000,
          choices: [
            {
              index: 0,
              finish_reason: "stop",
              message: {
                role: "assistant",
                content: "MISTRAL_MOCK_OK",
              },
            },
          ],
          usage: {
            prompt_tokens: 3,
            completion_tokens: 1,
            total_tokens: 4,
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

  const model = provider("mistral-small-latest");
  const result = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "Reply with MISTRAL_MOCK_OK" }] }],
    maxTokens: 16,
    temperature: 0,
  });

  assert.strictEqual(requestUrl, "https://api.example.test/v1/chat/completions");
  assert.strictEqual(authHeader, "Bearer test-key");
  assert.strictEqual(extraHeader, "present");
  assert.strictEqual(requestBody.model, "mistral-small-latest");
  assert.deepStrictEqual(requestBody.messages[0].content, [
    {
      type: "text",
      text: "Reply with MISTRAL_MOCK_OK",
    },
  ]);
  assert.strictEqual(result.content[0].type, "text");
  assert.strictEqual(result.content[0].text, "MISTRAL_MOCK_OK");
  assert.strictEqual(result.usage.inputTokens.total, 3);
  assert.strictEqual(result.usage.outputTokens.total, 1);

  return "PASS: mistral.doGenerate sends expected request and parses mocked response";
};
