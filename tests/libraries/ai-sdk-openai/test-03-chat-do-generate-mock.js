import assert from "assert";
import { createOpenAI } from "@ai-sdk/openai";

export const run = async () => {
  let requestUrl = "";
  let requestBody = null;
  let requestAuthHeader = "";

  const provider = createOpenAI({
    apiKey: "test-key",
    baseURL: "https://api.example.test/v1",
    fetch: async (url, init) => {
      requestUrl = String(url);
      requestAuthHeader = new Headers(init?.headers).get("authorization") || "";
      requestBody = JSON.parse(String(init?.body || "{}"));

      return new Response(
        JSON.stringify({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1711115037,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "HELLO_FROM_CHAT_MOCK" },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 3, completion_tokens: 1, total_tokens: 4 },
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

  const model = provider.chat("gpt-4o-mini");
  const result = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "Reply with HELLO" }] }],
  });

  assert.strictEqual(requestUrl, "https://api.example.test/v1/chat/completions");
  assert.strictEqual(requestAuthHeader, "Bearer test-key");
  assert.strictEqual(requestBody.model, "gpt-4o-mini");
  assert.strictEqual(result.content[0].type, "text");
  assert.strictEqual(result.content[0].text, "HELLO_FROM_CHAT_MOCK");

  return "PASS: chat.doGenerate issues expected request and parses mocked completion";
};
