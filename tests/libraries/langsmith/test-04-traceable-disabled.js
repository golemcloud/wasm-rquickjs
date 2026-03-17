import assert from "assert";
import { isTraceableFunction, traceable } from "langsmith/traceable";

export const run = async () => {
  const fn = traceable(
    async (left, right) => ({
      sum: left + right,
    }),
    {
      name: "sum-fn",
      run_type: "chain",
      tracingEnabled: false,
    },
  );

  assert.strictEqual(isTraceableFunction(fn), true);

  const result = await fn(20, 22);
  assert.deepStrictEqual(result, { sum: 42 });

  return "PASS: traceable works with tracing disabled";
};
