import assert from "assert";
import dayjs from "dayjs";

export const run = () => {
  const base = dayjs("2024-01-31");
  const plusMonth = base.add(1, "month");
  const minusWeeks = plusMonth.subtract(2, "week");

  assert.strictEqual(base.format("YYYY-MM-DD"), "2024-01-31");
  assert.strictEqual(plusMonth.format("YYYY-MM-DD"), "2024-02-29");
  assert.strictEqual(minusWeeks.format("YYYY-MM-DD"), "2024-02-15");

  const endOfMonth = dayjs("2024-02-11").endOf("month");
  assert.strictEqual(endOfMonth.format("YYYY-MM-DD"), "2024-02-29");

  return "PASS: core parsing, arithmetic, and immutability work";
};
