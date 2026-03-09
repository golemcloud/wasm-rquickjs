import assert from "assert";
import { vi } from "vitest";

export const run = () => {
  const calculator = {
    add(a, b) {
      return a + b;
    },
  };

  const spy = vi.spyOn(calculator, "add");

  assert.strictEqual(calculator.add(2, 3), 5);
  spy.mockImplementation((a, b) => a * b);
  assert.strictEqual(calculator.add(2, 3), 6);
  assert.strictEqual(spy.mock.calls.length, 2);

  spy.mockRestore();
  assert.strictEqual(calculator.add(2, 3), 5);

  return "PASS: vi.spyOn can override and restore method behavior";
};
