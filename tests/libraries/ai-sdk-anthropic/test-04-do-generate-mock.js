import assert from "assert";
import { createAnthropic } from "@ai-sdk/anthropic";

export const run = async () => {
  let requestUrl = "";
  let requestBody = null;
  let apiKeyHeader = "";
  let anthropicVersionHeader = "";

  const provider = createAnthropic({
    apiKey: "test-key",
    baseURL: "https://api.example.test/v1",
    fetch: async (url, init) => {
      requestUrl = String(url);
      const headers = new Headers(init?.headers);
      apiKeyHeader = headers.get("x-api-key") || "";
      anthropicVersionHeader = headers.get("anthropic-version") || "";
      requestBody = JSON.parse(String(init?.body || "{}"));

      return new Response(
        JSON.stringify({
          id: "msg_test_1",
          type: "message",
          role: "assistant",
          model: "claude-3-haiku-20240307",
          content: [{ type: "text", text: "HELLO_FROM_ANTHROPIC_MOCK" }],
          stop_reason: "end_turn",
          stop_sequence: null,
          usage: {
            input_tokens: 3,
            output_tokens: 1,
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

  const model = provider("claude-3-haiku-20240307");
  const result = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "Reply with HELLO" }] }],
  });

  assert.strictEqual(requestUrl, "https://api.example.test/v1/messages");
  assert.strictEqual(requestBody.model, "claude-3-haiku-20240307");
  assert.strictEqual(apiKeyHeader, "test-key");
  assert.strictEqual(anthropicVersionHeader, "2023-06-01");
  assert.strictEqual(result.content[0].type, "text");
  assert.strictEqual(result.content[0].text, "HELLO_FROM_ANTHROPIC_MOCK");

  return "PASS: anthropic.doGenerate issues expected request and parses mocked response";
};
