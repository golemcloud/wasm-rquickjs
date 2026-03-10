import assert from "assert";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export const run = () => {
  const parsed = dayjs.duration("P1DT2H30M");
  assert.strictEqual(parsed.asMinutes(), 1590);
  assert.strictEqual(parsed.toISOString(), "P1DT2H30M");

  const constructed = dayjs.duration({ days: 2, hours: 5, minutes: 10 });
  assert.strictEqual(constructed.asHours(), 53.166666666666664);

  const from = dayjs("2024-01-01");
  const to = dayjs("2024-01-04");
  assert.strictEqual(from.from(to), "3 days ago");
  assert.strictEqual(from.to(to), "in 3 days");

  return "PASS: duration and relativeTime plugins behave correctly";
};
