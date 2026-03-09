import assert from "assert";
import { AIMessage, createAgent, fakeModel } from "langchain";

export const run = async () => {
  const model = fakeModel().respond(new AIMessage("pong"));
  const agent = createAgent({ model, tools: [] });

  const result = await agent.invoke({
    messages: [{ role: "user", content: "ping" }],
  });

  assert.strictEqual(Array.isArray(result.messages), true);
  assert.strictEqual(result.messages.length, 2);
  assert.strictEqual(result.messages[0].content, "ping");
  assert.strictEqual(result.messages[1].content, "pong");

  return "PASS: createAgent works with fakeModel for offline invocation";
};
