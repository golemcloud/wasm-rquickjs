import assert from "assert";
import { pruneMessages } from "ai";

export const run = () => {
  const messages = [
    {
      role: "assistant",
      content: [
        { type: "reasoning", text: "internal" },
        { type: "text", text: "answer" },
      ],
    },
    {
      role: "assistant",
      content: [
        { type: "reasoning", text: "latest internal" },
        { type: "text", text: "latest answer" },
      ],
    },
  ];

  const allPruned = pruneMessages({ messages, reasoning: "all" });
  assert.ok(allPruned.every((m) => m.content.every((part) => part.type !== "reasoning")));

  const keepLast = pruneMessages({ messages, reasoning: "before-last-message" });
  assert.ok(keepLast[0].content.every((part) => part.type !== "reasoning"));
  assert.ok(keepLast[1].content.some((part) => part.type === "reasoning"));

  return "PASS: pruneMessages removes reasoning with both supported policies";
};
