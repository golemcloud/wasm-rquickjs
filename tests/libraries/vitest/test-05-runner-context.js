import assert from "assert";
import { vi } from "vitest";

export const run = () => {
  const fn = vi.fn((value) => value + 1);
  assert.strictEqual(vi.isMockFunction(fn), true);
  assert.strictEqual(vi.mocked(fn), fn);

  fn(1);
  fn(2);
  assert.strictEqual(fn.mock.calls.length, 2);

  const target = {
    value(input) {
      return input * 2;
    },
  };

  const spy = vi.spyOn(target, "value").mockReturnValue(50);
  assert.strictEqual(target.value(10), 50);
  assert.strictEqual(spy.mock.calls.length, 1);

  vi.clearAllMocks();
  assert.strictEqual(fn.mock.calls.length, 0);
  assert.strictEqual(spy.mock.calls.length, 0);
  assert.strictEqual(target.value(10), 50);

  vi.restoreAllMocks();
  assert.strictEqual(target.value(10), 20);

  return "PASS: vi mock lifecycle helpers clear call state and restore spies";
};
