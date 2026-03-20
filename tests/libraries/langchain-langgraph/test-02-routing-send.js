import assert from "assert";
import { Annotation, END, START, Send, StateGraph } from "@langchain/langgraph";

const GraphState = Annotation.Root({
  subjects: Annotation,
  results: Annotation({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
});

export const run = async () => {
  const graph = new StateGraph(GraphState)
    .addNode("fanout", (state) => ({
      results: [`processed:${state.subjects[0]}`],
    }))
    .addConditionalEdges(START, (state) =>
      state.subjects.map((subject) => new Send("fanout", { subjects: [subject] }))
    )
    .addEdge("fanout", END)
    .compile();

  const output = await graph.invoke({
    subjects: ["alpha", "beta", "gamma"],
  });

  assert.deepStrictEqual(output.subjects, ["alpha", "beta", "gamma"]);
  assert.strictEqual(output.results.length, 3);
  assert.ok(output.results.includes("processed:alpha"));
  assert.ok(output.results.includes("processed:beta"));
  assert.ok(output.results.includes("processed:gamma"));

  return "PASS: conditional routing with Send fans out work and merges reducer state";
};
