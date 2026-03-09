import assert from "assert";
import { hasToolCall, stepCountIs } from "ai";

export const run = () => {
  const twoSteps = stepCountIs(2);
  assert.strictEqual(twoSteps({ steps: [{}, {}] }), true);
  assert.strictEqual(twoSteps({ steps: [{}] }), false);

  const hasSearchCall = hasToolCall("search");
  assert.strictEqual(
    hasSearchCall({
      steps: [
        {
          toolCalls: [{ toolCallId: "tc-1", toolName: "search", input: { q: "wasm" } }],
        },
      ],
    }),
    true,
  );

  assert.strictEqual(
    hasSearchCall({
      steps: [
        {
          toolCalls: [{ toolCallId: "tc-2", toolName: "weather", input: { q: "oslo" } }],
        },
      ],
    }),
    false,
  );

  return "PASS: stop-condition helpers detect step count and tool calls";
};
