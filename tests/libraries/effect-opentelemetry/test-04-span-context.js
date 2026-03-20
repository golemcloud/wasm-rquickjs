import assert from "assert";
import * as Tracer from "@effect/opentelemetry/Tracer";

export const run = () => {
  const sampled = Tracer.makeExternalSpan({
    traceId: "0123456789abcdef0123456789abcdef",
    spanId: "0123456789abcdef",
    traceFlags: 1,
    traceState: "vendor=value",
  });

  assert.strictEqual(sampled.traceId, "0123456789abcdef0123456789abcdef");
  assert.strictEqual(sampled.spanId, "0123456789abcdef");
  assert.strictEqual(sampled.sampled, true);

  const notSampled = Tracer.makeExternalSpan({
    traceId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    spanId: "bbbbbbbbbbbbbbbb",
    traceFlags: 0,
  });

  assert.strictEqual(notSampled.traceId, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.strictEqual(notSampled.spanId, "bbbbbbbbbbbbbbbb");
  assert.strictEqual(notSampled.sampled, false);

  return "PASS: Tracer.makeExternalSpan maps ids and sampled flags correctly";
};
