import assert from "assert";
import {
  ValueError,
  ServiceError,
  WorkflowNotFoundError,
  ActivityCancelledError,
  isRetryableError,
  defaultGrpcRetryOptions,
} from "@temporalio/client";

export const run = () => {
  const ve = new ValueError("invalid value");
  assert.strictEqual(ve.name, "ValueError");
  assert.ok(ve instanceof ValueError);
  assert.ok(ve instanceof Error);

  const se = new ServiceError("service unavailable", { code: 14 });
  assert.strictEqual(se.name, "ServiceError");
  assert.ok(se instanceof ServiceError);

  const wnf = new WorkflowNotFoundError("missing workflow", "wid-1", "rid-1");
  assert.strictEqual(wnf.name, "WorkflowNotFoundError");
  assert.ok(wnf instanceof WorkflowNotFoundError);

  const ace = new ActivityCancelledError("cancelled", "act-1");
  assert.strictEqual(ace.name, "ActivityCancelledError");
  assert.ok(ace instanceof ActivityCancelledError);

  assert.strictEqual(isRetryableError({ code: 14 }), true);
  assert.strictEqual(isRetryableError({ code: 3 }), false);
  const retryOptions = defaultGrpcRetryOptions();
  assert.strictEqual(typeof retryOptions.delayFunction, "function");
  assert.strictEqual(typeof retryOptions.retryableDecider, "function");

  return "PASS: error hierarchy and grpc retry helpers behave as expected";
};
