import assert from "assert";
import { addDays, differenceInCalendarDays, isWeekend, subMonths } from "date-fns";

export const run = () => {
  const base = new Date(Date.UTC(2024, 0, 31, 12, 0, 0));
  const plusTenDays = addDays(base, 10);

  assert.strictEqual(plusTenDays.toISOString(), "2024-02-10T12:00:00.000Z");
  assert.strictEqual(base.toISOString(), "2024-01-31T12:00:00.000Z");

  const march31 = new Date(2024, 2, 31, 9, 30, 0);
  const oneMonthBack = subMonths(march31, 1);
  assert.strictEqual(oneMonthBack.getFullYear(), 2024);
  assert.strictEqual(oneMonthBack.getMonth(), 1);
  assert.strictEqual(oneMonthBack.getDate(), 29);
  assert.strictEqual(oneMonthBack.getHours(), 9);
  assert.strictEqual(oneMonthBack.getMinutes(), 30);

  const dayDiff = differenceInCalendarDays(
    new Date(Date.UTC(2024, 1, 10, 0, 0, 0)),
    new Date(Date.UTC(2024, 1, 1, 0, 0, 0)),
  );
  assert.strictEqual(dayDiff, 9);

  assert.strictEqual(isWeekend(new Date(Date.UTC(2024, 1, 10, 0, 0, 0))), true);

  return "PASS: date arithmetic and calendar helpers work";
};
