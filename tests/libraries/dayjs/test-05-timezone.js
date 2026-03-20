import assert from "assert";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export const run = () => {
  const nyTime = dayjs.tz("2024-01-15 08:00", "America/New_York");
  assert.strictEqual(nyTime.utc().format("YYYY-MM-DDTHH:mm"), "2024-01-15T13:00");

  const tokyo = dayjs.utc("2024-06-01T12:00:00Z").tz("Asia/Tokyo");
  assert.strictEqual(tokyo.format("YYYY-MM-DD HH:mm"), "2024-06-01 21:00");

  const guessed = dayjs.tz.guess();
  assert.strictEqual(typeof guessed, "string");
  assert.strictEqual(guessed.length > 0, true);

  return "PASS: utc/timezone plugin conversions and timezone detection work";
};
