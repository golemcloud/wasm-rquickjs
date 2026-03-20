import assert from "assert";
import { RunTree } from "langsmith/run_trees";
import { getCurrentRunTree, withRunTree } from "langsmith/traceable";

export const run = async () => {
  const root = new RunTree({
    name: "header-root",
    run_type: "chain",
    inputs: { value: "x" },
  });

  const headers = root.toHeaders();
  assert.strictEqual(typeof headers["langsmith-trace"], "string");
  assert.strictEqual(typeof headers.baggage, "string");

  const restored = RunTree.fromHeaders(headers);
  assert.ok(restored);
  assert.strictEqual(restored.trace_id, root.trace_id);

  const currentId = await withRunTree(root, async () => {
    return getCurrentRunTree()?.id;
  });
  assert.strictEqual(currentId, root.id);

  return "PASS: RunTree headers and trace context helpers work";
};
