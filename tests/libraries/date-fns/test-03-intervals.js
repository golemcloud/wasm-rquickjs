import assert from "assert";
import {
  areIntervalsOverlapping,
  eachDayOfInterval,
  intervalToDuration,
  isWithinInterval,
} from "date-fns";

export const run = () => {
  const interval = {
    start: new Date(2024, 0, 1, 0, 0, 0),
    end: new Date(2024, 0, 5, 0, 0, 0),
  };

  const days = eachDayOfInterval(interval);
  assert.strictEqual(days.length, 5);
  assert.strictEqual(days[0].getDate(), 1);
  assert.strictEqual(days[4].getDate(), 5);

  const overlap = areIntervalsOverlapping(
    { start: new Date(2024, 0, 1), end: new Date(2024, 0, 3) },
    { start: new Date(2024, 0, 3), end: new Date(2024, 0, 6) },
  );
  assert.strictEqual(overlap, false);

  const inclusiveOverlap = areIntervalsOverlapping(
    { start: new Date(2024, 0, 1), end: new Date(2024, 0, 3) },
    { start: new Date(2024, 0, 3), end: new Date(2024, 0, 6) },
    { inclusive: true },
  );
  assert.strictEqual(inclusiveOverlap, true);

  const duration = intervalToDuration({
    start: new Date(2024, 0, 1, 0, 0, 0),
    end: new Date(2024, 0, 2, 1, 2, 3),
  });
  assert.strictEqual(duration.days, 1);
  assert.strictEqual(duration.hours, 1);
  assert.strictEqual(duration.minutes, 2);
  assert.strictEqual(duration.seconds, 3);

  const inRange = isWithinInterval(new Date(2024, 0, 4, 12, 0, 0), interval);
  assert.strictEqual(inRange, true);

  return "PASS: interval generation, overlap checks, and duration conversion work";
};
