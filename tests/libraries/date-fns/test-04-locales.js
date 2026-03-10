import assert from "assert";
import {
  format,
  formatDistance,
  getDefaultOptions,
  setDefaultOptions,
  startOfWeek,
} from "date-fns";
import { enUS, fr } from "date-fns/locale";

export const run = () => {
  const saved = getDefaultOptions();

  try {
    const monthName = format(new Date(2024, 6, 14), "MMMM", { locale: fr });
    assert.strictEqual(monthName, "juillet");

    const distance = formatDistance(new Date(2024, 0, 2), new Date(2024, 0, 1), { locale: fr });
    assert.strictEqual(distance, "1 jour");

    const sunday = new Date(2024, 6, 14);
    const usWeekStart = startOfWeek(sunday, { locale: enUS });
    const frWeekStart = startOfWeek(sunday, { locale: fr });
    assert.strictEqual(usWeekStart.getDay(), 0);
    assert.strictEqual(frWeekStart.getDay(), 1);

    setDefaultOptions({ locale: fr });
    const defaultLocalizedMonth = format(new Date(2024, 6, 14), "MMMM");
    assert.strictEqual(defaultLocalizedMonth, "juillet");
  } finally {
    setDefaultOptions(saved);
  }

  return "PASS: locale data and default options behavior work";
};
