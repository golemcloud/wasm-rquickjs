import assert from "assert";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";
import updateLocale from "dayjs/plugin/updateLocale.js";

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(updateLocale);

export const run = () => {
  const parsed = dayjs("31/12/2024 23:59", "DD/MM/YYYY HH:mm", true);
  assert.strictEqual(parsed.isValid(), true);
  assert.strictEqual(parsed.format("YYYY-MM-DD HH:mm"), "2024-12-31 23:59");

  const invalidStrict = dayjs("2024/31/12", "DD/MM/YYYY", true);
  assert.strictEqual(invalidStrict.isValid(), false);

  dayjs.updateLocale("en", { weekStart: 1 });
  const startOfWeek = dayjs("2024-03-06").startOf("week");
  assert.strictEqual(startOfWeek.format("YYYY-MM-DD"), "2024-03-04");

  const localized = dayjs("2024-03-06").format("L");
  assert.strictEqual(localized, "03/06/2024");

  return "PASS: custom parse and locale customization plugins work";
};
