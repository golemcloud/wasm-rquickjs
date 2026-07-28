const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const fg = require('fast-glob');

exports.run = async () => {
  const root = path.join(process.cwd(), 'fixtures', 'glob');
  fs.mkdirSync(path.join(root, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(root, 'a.txt'), 'a');
  fs.writeFileSync(path.join(root, 'nested', 'b.txt'), 'b');
  fs.writeFileSync(path.join(root, 'nested', 'ignore.log'), 'log');

  const entries = await fg('**/*.txt', { cwd: root, onlyFiles: true });
  assert.deepStrictEqual(entries.sort(), ['a.txt', 'nested/b.txt']);
  return 'PASS: fast-glob reads files from attached filesystem';
};
