const assert = require('node:assert');
const ini = require('ini');
const toml = require('toml');

exports.run = () => {
  const parsedIni = ini.parse('name=installed-app\n[limits]\ncount=42\n');
  assert.strictEqual(parsedIni.name, 'installed-app');
  assert.strictEqual(parsedIni.limits.count, '42');

  const parsedToml = toml.parse('name = "installed-app"\n[limits]\ncount = 42\n');
  assert.strictEqual(parsedToml.name, 'installed-app');
  assert.strictEqual(parsedToml.limits.count, 42);
  return 'PASS: ini and toml config parsers execute from installed packages';
};
