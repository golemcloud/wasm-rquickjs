import assert from "assert";
import { createOpenAI } from "@ai-sdk/openai";

export const run = async () => {
  const apiKey = process.env.OPENAI_API_KEY || "missing-openai-api-key";

  const provider = createOpenAI({
    apiKey,
  });

  const model = provider.chat("gpt-4o-mini");
  const result = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "Reply with exactly HELLO_OPENAI_PROVIDER_TEST" }] }],
    temperature: 0,
    maxOutputTokens: 20,
  });

  const textBlocks = result.content.filter((block) => block.type === "text");
  assert.ok(textBlocks.length > 0, "Expected at least one text block");

  const output = textBlocks.map((block) => block.text).join(" ").trim();
  assert.ok(output.includes("HELLO_OPENAI_PROVIDER_TEST"), `Unexpected output: ${output}`);

  return "PASS: live OpenAI chat completion returns expected marker text";
};
