import assert from "assert";
import { compileWorkflowOptions } from "@temporalio/client";

export const run = () => {
  const compiled = compileWorkflowOptions({
    taskQueue: "queue-a",
    workflowId: "wf-1",
    workflowExecutionTimeout: "1 minute",
    workflowRunTimeout: "30 seconds",
    workflowTaskTimeout: "10 seconds",
    retry: {
      initialInterval: "1 second",
      backoffCoefficient: 2,
      maximumAttempts: 3,
      nonRetryableErrorTypes: ["FatalError"],
    },
    memo: {
      key: "value",
    },
  });

  assert.strictEqual(compiled.workflowId, "wf-1");
  assert.strictEqual(compiled.taskQueue, "queue-a");
  assert.ok(compiled.workflowExecutionTimeout);
  assert.ok(compiled.workflowRunTimeout);
  assert.ok(compiled.workflowTaskTimeout);
  assert.ok(compiled.retry);

  let threw = false;
  try {
    compileWorkflowOptions({
      taskQueue: "queue-a",
      workflowId: "wf-bad",
      workflowTaskTimeout: "not-a-duration",
    });
  } catch (e) {
    threw = true;
    assert.strictEqual(e.name, "TypeError");
    assert.ok(String(e.message).includes("Invalid duration string"));
  }

  assert.strictEqual(threw, true);

  return "PASS: workflow options compile and invalid duration values are rejected";
};
