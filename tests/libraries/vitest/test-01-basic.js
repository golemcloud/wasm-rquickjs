import assert from "assert";
import { vi } from "vitest";

export const run = () => {
  const mock = vi.fn((value) => value * 2);

  assert.strictEqual(mock(2), 4);
  assert.strictEqual(mock(5), 10);

  mock.mockReturnValueOnce(99);
  assert.strictEqual(mock(7), 99);

  assert.strictEqual(mock.mock.calls.length, 3);
  assert.deepStrictEqual(mock.mock.calls[0], [2]);
  assert.deepStrictEqual(mock.mock.calls[2], [7]);
  assert.strictEqual(mock.mock.results[1].value, 10);

  return "PASS: vi.fn tracks calls, results, and one-time return values";
};
