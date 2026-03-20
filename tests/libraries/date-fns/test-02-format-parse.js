import assert from "assert";
import { format, isMatch, parse, parseISO, parseJSON } from "date-fns";

export const run = () => {
  const localDate = new Date(2024, 4, 20, 15, 45, 30);
  const pattern = "yyyy-MM-dd HH:mm:ss";
  const formatted = format(localDate, pattern);
  assert.strictEqual(formatted, "2024-05-20 15:45:30");

  const parsed = parse(formatted, pattern, new Date(0));
  assert.strictEqual(parsed.getFullYear(), 2024);
  assert.strictEqual(parsed.getMonth(), 4);
  assert.strictEqual(parsed.getDate(), 20);
  assert.strictEqual(parsed.getHours(), 15);
  assert.strictEqual(parsed.getMinutes(), 45);
  assert.strictEqual(parsed.getSeconds(), 30);

  assert.strictEqual(isMatch("2024-05-20", "yyyy-MM-dd"), true);
  assert.strictEqual(isMatch("20/05/2024", "yyyy-MM-dd"), false);

  const fromIso = parseISO("2024-01-31T12:34:56.000Z");
  assert.strictEqual(fromIso.toISOString(), "2024-01-31T12:34:56.000Z");

  const fromJson = parseJSON("2024-02-01T03:04:05.000Z");
  assert.strictEqual(fromJson.toISOString(), "2024-02-01T03:04:05.000Z");

  return "PASS: formatting and parsing APIs work";
};
