const assert = require('node:assert');

exports.run = () => {
  const scanner = require('esm-false-positive-scanner');
  assert.strictEqual(scanner.propertyRequireResult.ok, true);
  assert.strictEqual(scanner.nonCallCreateRequireAlias.ok, true);
  assert.strictEqual(scanner.localCreateRequireResult.ok, true);

  const cjsWithNestedRequire = require('cjs-nested-require-pkg');
  assert.deepStrictEqual(cjsWithNestedRequire, { ok: true });
  return 'PASS: graph scanners avoid property require, non-call createRequire, local createRequire, and nested CJS require false positives';
};
