import assert from "assert";
import {
  Annotation,
  Command,
  EmptyChannelError,
  END,
  GraphRecursionError,
  InvalidUpdateError,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { LastValue } from "@langchain/langgraph/channels";

export const run = async () => {
  const channel = new LastValue();
  assert.throws(() => channel.get(), (err) => err instanceof EmptyChannelError);
  assert.strictEqual(channel.update(["value-1"]), true);
  assert.strictEqual(channel.get(), "value-1");
  assert.throws(
    () => channel.update(["value-2", "value-3"]),
    (err) => err instanceof InvalidUpdateError
  );

  const RoutedState = Annotation.Root({
    route: Annotation,
  });

  const routedGraph = new StateGraph(RoutedState)
    .addNode(
      "entry",
      () =>
        new Command({
          update: { route: "next" },
          goto: "next",
        }),
      { ends: ["next"] }
    )
    .addNode("next", (state) => ({ route: `${state.route}!` }))
    .addEdge(START, "entry")
    .addEdge("next", END)
    .compile();

  const routedOutput = await routedGraph.invoke({});
  assert.strictEqual(routedOutput.route, "next!");

  const LoopState = Annotation.Root({
    ticks: Annotation({
      reducer: (left, right) => left + right,
      default: () => 0,
    }),
  });

  const loopGraph = new StateGraph(LoopState)
    .addNode("loop", () => ({ ticks: 1 }))
    .addEdge(START, "loop")
    .addEdge("loop", "loop")
    .compile();

  await assert.rejects(
    () => loopGraph.invoke({}, { recursionLimit: 3 }),
    (err) => err instanceof GraphRecursionError
  );

  return "PASS: channel errors, Command routing, and recursion-limit errors are enforced";
};
