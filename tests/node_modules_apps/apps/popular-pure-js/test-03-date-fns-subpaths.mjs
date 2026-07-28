import assert from 'node:assert';
import { addDays } from 'date-fns/addDays';
import { formatISO } from 'date-fns/formatISO';
import { parseISO } from 'date-fns/parseISO';

export const run = () => {
  const start = parseISO('2026-06-16T00:00:00.000Z');
  const result = addDays(start, 3);
  assert.strictEqual(formatISO(result, { representation: 'date' }), '2026-06-19');
  return 'PASS: date-fns subpath exports resolve from installed node_modules';
};
