import assert from "assert";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  coerceMessageLikeToMessage,
  getBufferString,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
} from "@langchain/core/messages";

export const run = async () => {
  const messages = [
    new SystemMessage("Be concise."),
    new HumanMessage("Hello"),
    new AIMessage("Hi!"),
  ];

  const coerced = coerceMessageLikeToMessage(["human", "How are you?"]);
  assert.strictEqual(coerced._getType(), "human");
  assert.strictEqual(coerced.content, "How are you?");

  const buffer = getBufferString(messages);
  assert.ok(buffer.includes("System: Be concise."));
  assert.ok(buffer.includes("Human: Hello"));
  assert.ok(buffer.includes("AI: Hi!"));

  const stored = mapChatMessagesToStoredMessages(messages);
  const restored = mapStoredMessagesToChatMessages(stored);
  assert.strictEqual(restored.length, 3);
  assert.strictEqual(restored[0].content, "Be concise.");
  assert.strictEqual(restored[1].content, "Hello");
  assert.strictEqual(restored[2].content, "Hi!");

  return "PASS: message coercion, buffer rendering, and storage mapping work";
};
