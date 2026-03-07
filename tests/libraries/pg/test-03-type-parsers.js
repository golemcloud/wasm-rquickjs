import assert from 'assert';
import pg from 'pg';

const { types } = pg;

export const run = () => {
  const oidInt4 = 23;
  const originalParser = types.getTypeParser(oidInt4, 'text');

  types.setTypeParser(oidInt4, 'text', (value) => Number(value) + 10);
  const overriddenParser = types.getTypeParser(oidInt4, 'text');
  assert.strictEqual(overriddenParser('32'), 42);

  types.setTypeParser(oidInt4, 'text', originalParser);
  const restoredParser = types.getTypeParser(oidInt4, 'text');
  assert.strictEqual(restoredParser('32'), originalParser('32'));

  return 'PASS: global type parser overrides can be set and restored';
};
