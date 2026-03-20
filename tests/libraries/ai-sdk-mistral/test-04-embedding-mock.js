import assert from "assert";
import { createMistral } from "@ai-sdk/mistral";

export const run = async () => {
  let requestUrl = "";
  let requestBody = null;

  const provider = createMistral({
    apiKey: "test-key",
    baseURL: "https://api.example.test/v1",
    fetch: async (url, init) => {
      requestUrl = String(url);
      requestBody = JSON.parse(String(init?.body || "{}"));

      return new Response(
        JSON.stringify({
          id: "embd-test",
          object: "list",
          model: "mistral-embed",
          data: [
            {
              object: "embedding",
              index: 0,
              embedding: [0.1, 0.2, 0.3],
            },
            {
              object: "embedding",
              index: 1,
              embedding: [1.1, 1.2, 1.3],
            },
          ],
          usage: {
            prompt_tokens: 8,
            total_tokens: 8,
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

  const model = provider.embedding("mistral-embed");
  const result = await model.doEmbed({
    values: ["alpha", "beta"],
  });

  assert.strictEqual(requestUrl, "https://api.example.test/v1/embeddings");
  assert.strictEqual(requestBody.model, "mistral-embed");
  assert.deepStrictEqual(requestBody.input, ["alpha", "beta"]);
  assert.strictEqual(result.embeddings.length, 2);
  assert.deepStrictEqual(result.embeddings[0], [0.1, 0.2, 0.3]);

  return "PASS: mistral embedding model sends expected body and parses mocked embeddings";
};
