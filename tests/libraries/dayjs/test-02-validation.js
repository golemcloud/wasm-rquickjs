import assert from "assert";
import dayjs from "dayjs";

export const run = () => {
  const a = dayjs("2024-03-01");
  const b = dayjs("2024-03-15");

  assert.strictEqual(b.diff(a, "day"), 14);
  assert.strictEqual(a.isBefore(b), true);
  assert.strictEqual(b.isAfter(a), true);
  assert.strictEqual(a.isSame("2024-03-01", "day"), true);

  const invalid = dayjs("not-a-date");
  assert.strictEqual(invalid.isValid(), false);

  const start = dayjs("2024-03-20").startOf("month");
  assert.strictEqual(start.format("YYYY-MM-DD"), "2024-03-01");

  return "PASS: comparisons, diff, and validation behavior match expectations";
};
