const assert = require('node:assert');

exports.run = () => {
  const pkg = require('pattern-imports');
  assert.deepStrictEqual(pkg, { value: 'internal-value' });
  return 'PASS: package imports wildcard patterns resolve through installed packages';
};
