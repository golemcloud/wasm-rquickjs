import assert from 'assert';
import {
  SamplingDecision,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';

export const run = () => {
  const lowTraceId = '00000000000000000000000000000001';
  const highTraceId = '80000000000000000000000000000001';

  const half = new TraceIdRatioBasedSampler(0.5);
  assert.strictEqual(
    half.shouldSample({}, lowTraceId).decision,
    SamplingDecision.RECORD_AND_SAMPLED,
    'expected low trace id to be sampled at 0.5 ratio'
  );
  assert.strictEqual(
    half.shouldSample({}, highTraceId).decision,
    SamplingDecision.NOT_RECORD,
    'expected high trace id to be dropped at 0.5 ratio'
  );

  const all = new TraceIdRatioBasedSampler(2);
  assert.strictEqual(
    all.shouldSample({}, highTraceId).decision,
    SamplingDecision.RECORD_AND_SAMPLED,
    'ratio > 1 should normalize to always sample'
  );

  const none = new TraceIdRatioBasedSampler(-1);
  assert.strictEqual(
    none.shouldSample({}, lowTraceId).decision,
    SamplingDecision.NOT_RECORD,
    'ratio < 0 should normalize to never sample'
  );

  assert.strictEqual(half.toString(), 'TraceIdRatioBased{0.5}');
  return 'PASS: TraceIdRatioBasedSampler produces deterministic sampling decisions';
};
