import assert from "assert";
import { RunTree } from "langsmith/run_trees";

export const run = async () => {
  const root = new RunTree({
    name: "root-run",
    run_type: "chain",
    inputs: { question: "what is 2+2?" },
  });

  const child = root.createChild({
    name: "child-run",
    run_type: "tool",
    inputs: { value: 2 },
  });

  await child.end({ answer: 4 });
  await root.end({ done: true });

  const serialized = root.toJSON();
  assert.strictEqual(serialized.name, "root-run");
  assert.strictEqual(serialized.run_type, "chain");
  assert.strictEqual(Array.isArray(serialized.child_runs), true);
  assert.strictEqual(serialized.child_runs.length, 1);
  assert.strictEqual(serialized.child_runs[0].name, "child-run");

  return "PASS: RunTree createChild/end/toJSON works";
};
