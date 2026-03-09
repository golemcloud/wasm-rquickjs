import assert from "assert";
import { vi } from "vitest";

export const run = async () => {
  let waitForError = "";
  try {
    await vi.waitFor(() => true, { timeout: 50, interval: 10 });
  } catch (error) {
    waitForError = error?.message || String(error);
  }
  assert.match(waitForError, /internal state/i);

  let waitUntilError = "";
  try {
    await vi.waitUntil(() => true, { timeout: 50, interval: 10 });
  } catch (error) {
    waitUntilError = error?.message || String(error);
  }
  assert.match(waitUntilError, /internal state/i);

  return "PASS: vi.waitFor and vi.waitUntil require Vitest internal worker state";
};
