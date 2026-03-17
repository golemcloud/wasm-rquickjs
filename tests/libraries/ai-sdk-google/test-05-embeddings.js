import assert from "assert";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const run = async () => {
  let requestUrl = "";
  let requestBody = null;
  let fetchCalls = 0;

  const provider = createGoogleGenerativeAI({
    apiKey: "test-key",
    baseURL: "https://api.example.test/v1beta",
    fetch: async (url, init) => {
      fetchCalls += 1;
      requestUrl = String(url);
      requestBody = JSON.parse(String(init?.body || "{}"));

      return new Response(
        JSON.stringify({
          embeddings: [
            { values: [0.1, 0.2, 0.3] },
            { values: [0.4, 0.5, 0.6] },
          ],
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

  const model = provider.embedding("gemini-embedding-001");

  const embedResult = await model.doEmbed({
    values: ["alpha", "beta"],
  });

  assert.strictEqual(requestUrl, "https://api.example.test/v1beta/models/gemini-embedding-001:batchEmbedContents");
  assert.strictEqual(requestBody.requests.length, 2);
  assert.deepStrictEqual(embedResult.embeddings, [
    [0.1, 0.2, 0.3],
    [0.4, 0.5, 0.6],
  ]);

  await assert.rejects(
    () => model.doEmbed({ values: Array.from({ length: 2049 }, (_, i) => `v-${i}`) }),
    (error) => {
      assert.match(error.name, /TooManyEmbeddingValuesForCallError/);
      assert.match(error.message, /up to 2048 values/i);
      return true;
    },
  );

  assert.strictEqual(fetchCalls, 1);

  return "PASS: embedding requests are formed correctly and value-limit validation is enforced";
};
