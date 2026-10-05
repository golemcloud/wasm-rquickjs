#!/usr/bin/env node
const { writeFileSync } = require('node:fs');

writeFileSync('/workspace/npm-exec-result.json', JSON.stringify({
  argv: process.argv,
  cwd: process.cwd(),
}));
console.log('npm-exec:ok');
if (process.argv.includes('exit-7')) {
  process.exit(7);
  writeFileSync('/workspace/npm-exec-after-exit', 'unreachable');
  process.exitCode = 0;
}
