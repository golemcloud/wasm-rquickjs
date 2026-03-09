import assert from "assert";
import { vi } from "vitest";

export const run = () => {
  const key = "__vitest_temp_global__";

  delete globalThis[key];
  vi.stubGlobal(key, { enabled: true });

  assert.deepStrictEqual(globalThis[key], { enabled: true });

  vi.unstubAllGlobals();
  assert.strictEqual(globalThis[key], undefined);

  return "PASS: vi.stubGlobal and vi.unstubAllGlobals mutate and restore globals";
};
