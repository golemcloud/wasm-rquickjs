import assert from "assert";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const GraphState = Annotation.Root({
  steps: Annotation({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  total: Annotation({
    reducer: (left, right) => left + right,
    default: () => 0,
  }),
  status: Annotation,
});

export const run = async () => {
  const graph = new StateGraph(GraphState)
    .addNode("startNode", () => ({
      steps: ["start"],
      total: 2,
      status: "booted",
    }))
    .addNode("finishNode", (state) => ({
      steps: [`finish:${state.status}`],
      total: 3,
    }))
    .addEdge(START, "startNode")
    .addEdge("startNode", "finishNode")
    .addEdge("finishNode", END)
    .compile();

  const output = await graph.invoke({});
  assert.deepStrictEqual(output.steps, ["start", "finish:booted"]);
  assert.strictEqual(output.total, 5);
  assert.strictEqual(output.status, "booted");

  return "PASS: state annotations and reducers compose across graph nodes";
};
