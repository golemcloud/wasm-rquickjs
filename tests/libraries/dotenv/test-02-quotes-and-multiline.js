import assert from 'assert';
import dotenv from 'dotenv';

export const run = () => {
  const parsed = dotenv.parse([
    'DQ="line1\\nline2"',
    "SQ='line1\\nline2'",
    'BT=`line1\\nline2`',
    'MULTI="first',
    'second"',
  ].join('\n'));

  assert.strictEqual(parsed.DQ, 'line1\nline2');
  assert.strictEqual(parsed.SQ, 'line1\\nline2');
  assert.strictEqual(parsed.BT, 'line1\\nline2');
  assert.strictEqual(parsed.MULTI, 'first\nsecond');

  return 'PASS: parse handles quote-specific escaping and multiline double-quoted values';
};
