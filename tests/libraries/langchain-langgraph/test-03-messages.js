import assert from "assert";
import {
  MessagesAnnotation,
  REMOVE_ALL_MESSAGES,
  StateGraph,
  END,
  START,
  messagesStateReducer,
} from "@langchain/langgraph";
import { AIMessage, HumanMessage, RemoveMessage } from "@langchain/core/messages";

export const run = async () => {
  const initial = [new HumanMessage({ id: "human-1", content: "hello" })];
  const appended = messagesStateReducer(initial, [
    new AIMessage({ id: "ai-1", content: "world" }),
  ]);
  assert.strictEqual(appended.length, 2);

  const removedOne = messagesStateReducer(appended, [new RemoveMessage({ id: "human-1" })]);
  assert.strictEqual(removedOne.length, 1);
  assert.strictEqual(removedOne[0].id, "ai-1");

  const removedAll = messagesStateReducer(removedOne, [
    new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
  ]);
  assert.strictEqual(removedAll.length, 0);

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("reply", (state) => ({
      messages: [
        {
          role: "assistant",
          content: `echo:${state.messages[state.messages.length - 1].content}`,
        },
      ],
    }))
    .addEdge(START, "reply")
    .addEdge("reply", END)
    .compile();

  const output = await graph.invoke({
    messages: [new HumanMessage({ id: "human-2", content: "ping" })],
  });

  assert.strictEqual(output.messages.length, 2);
  assert.strictEqual(output.messages[1].content, "echo:ping");

  return "PASS: message reducer and MessagesAnnotation graph behavior work";
};
