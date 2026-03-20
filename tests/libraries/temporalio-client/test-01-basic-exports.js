import assert from "assert";
import {
  Client,
  Connection,
  WorkflowClient,
  AsyncCompletionClient,
  ScheduleClient,
  TaskQueueClient,
  WorkflowIdReusePolicy,
  QueryRejectCondition,
} from "@temporalio/client";

export const run = () => {
  assert.strictEqual(typeof Client, "function");
  assert.strictEqual(typeof Connection.lazy, "function");
  assert.strictEqual(typeof WorkflowClient, "function");
  assert.strictEqual(typeof AsyncCompletionClient, "function");
  assert.strictEqual(typeof ScheduleClient, "function");
  assert.strictEqual(typeof TaskQueueClient, "function");

  assert.strictEqual(WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE, "ALLOW_DUPLICATE");
  assert.strictEqual(QueryRejectCondition.QUERY_REJECT_CONDITION_NONE, "NONE");

  return "PASS: core client exports and enums are available";
};
