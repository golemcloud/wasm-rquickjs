import assert from "assert";
import { createOpenAI } from "@ai-sdk/openai";

export const run = async () => {
  let requestUrl = "";
  let requestBody = null;

  const provider = createOpenAI({
    apiKey: "test-key",
    baseURL: "https://api.example.test/v1",
    fetch: async (url, init) => {
      requestUrl = String(url);
      requestBody = JSON.parse(String(init?.body || "{}"));

      return new Response(
        JSON.stringify({
          id: "resp_test_1",
          object: "response",
          created_at: 1741257730,
          status: "completed",
          error: null,
          incomplete_details: null,
          input: [],
          instructions: null,
          max_output_tokens: null,
          model: "gpt-4o-mini",
          output: [
            {
              id: "msg_test_1",
              type: "message",
              status: "completed",
              role: "assistant",
              content: [{ type: "output_text", text: "HELLO_FROM_RESPONSES_MOCK", annotations: [] }],
            },
          ],
          parallel_tool_calls: true,
          previous_response_id: null,
          reasoning: { effort: null, summary: null },
          store: true,
          temperature: 1,
          text: { format: { type: "text" } },
          tool_choice: "auto",
          tools: [],
          top_p: 1,
          truncation: "disabled",
          usage: {
            input_tokens: 2,
            input_tokens_details: { cached_tokens: 0 },
            output_tokens: 1,
            output_tokens_details: { reasoning_tokens: 0 },
            total_tokens: 3,
          },
          user: null,
          metadata: {},
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

  const model = provider.responses("gpt-4o-mini");
  const result = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "Reply with HELLO" }] }],
  });

  assert.strictEqual(requestUrl, "https://api.example.test/v1/responses");
  assert.strictEqual(requestBody.model, "gpt-4o-mini");
  assert.strictEqual(result.content[0].type, "text");
  assert.strictEqual(result.content[0].text, "HELLO_FROM_RESPONSES_MOCK");

  return "PASS: responses.doGenerate issues expected request and parses mocked response";
};
