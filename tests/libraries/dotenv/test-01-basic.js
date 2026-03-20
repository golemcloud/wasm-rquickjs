import assert from 'assert';
import dotenv from 'dotenv';

export const run = () => {
  const parsed = dotenv.parse([
    'FOO=bar',
    'BAR="baz"',
    '# COMMENT',
    'export BAZ=qux',
    'EMPTY=',
  ].join('\n'));

  assert.deepStrictEqual(parsed, {
    FOO: 'bar',
    BAR: 'baz',
    BAZ: 'qux',
    EMPTY: '',
  });

  return 'PASS: basic parse supports simple keys, export prefix, and empty values';
};
