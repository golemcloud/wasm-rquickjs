import assert from "assert";
import { Annotation, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";

const GraphState = Annotation.Root({
  counter: Annotation({
    reducer: (left, right) => left + right,
    default: () => 0,
  }),
});

export const run = async () => {
  const checkpointer = new MemorySaver();
  const graph = new StateGraph(GraphState)
    .addNode("increment", () => ({ counter: 1 }))
    .addEdge(START, "increment")
    .addEdge("increment", END)
    .compile({ checkpointer });

  const cfg = { configurable: { thread_id: "langgraph-memory-thread" } };

  const first = await graph.invoke({}, cfg);
  const second = await graph.invoke({}, cfg);
  assert.strictEqual(first.counter, 1);
  assert.strictEqual(second.counter, 2);

  const snapshot = await graph.getState(cfg);
  assert.strictEqual(snapshot.values.counter, 2);

  const history = [];
  for await (const entry of graph.getStateHistory(cfg)) {
    history.push(entry);
    if (history.length >= 3) {
      break;
    }
  }
  assert.ok(history.length >= 2);

  await checkpointer.deleteThread("langgraph-memory-thread");
  const afterDelete = await checkpointer.getTuple(cfg);
  assert.strictEqual(afterDelete, undefined);

  return "PASS: MemorySaver persists thread state and exposes snapshots/history";
};
