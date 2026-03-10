import assert from "assert";
import { intlFormat, intlFormatDistance } from "date-fns";

export const run = () => {
  const formatted = intlFormat(
    new Date(Date.UTC(2024, 0, 15, 13, 30, 0)),
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    },
    {
      locale: "en-US",
    },
  );
  assert.strictEqual(formatted, "01/15/2024");

  const rel = intlFormatDistance(
    new Date(Date.UTC(2024, 0, 16, 0, 0, 0)),
    new Date(Date.UTC(2024, 0, 15, 0, 0, 0)),
    {
      locale: "en-US",
      unit: "day",
      numeric: "always",
    },
  );
  assert.strictEqual(rel, "in 1 day");

  return "PASS: Intl-based formatting helpers work";
};
