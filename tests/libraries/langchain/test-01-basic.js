import assert from "assert";
import { AIMessage, HumanMessage, filterMessages, trimMessages } from "langchain";

export const run = async () => {
  const messages = [
    new HumanMessage("hello"),
    new AIMessage("hi there"),
    new HumanMessage("goodbye"),
  ];

  const humanOnly = filterMessages(messages, { includeTypes: ["human"] });
  assert.strictEqual(humanOnly.length, 2);
  assert.strictEqual(humanOnly[0].content, "hello");

  const trimmed = await trimMessages(messages, {
    maxTokens: 2,
    strategy: "last",
    tokenCounter: (msgs) => msgs.length,
  });

  assert.strictEqual(trimmed.length, 2);
  assert.strictEqual(trimmed[0].content, "hi there");
  assert.strictEqual(trimmed[1].content, "goodbye");

  return "PASS: message filtering and trimming work";
};
