#!/usr/bin/env node
const { writeFileSync } = require('node:fs');

writeFileSync('/workspace/npm-exec-result.json', JSON.stringify({
  argv: process.argv,
  cwd: process.cwd(),
}));
console.log('npm-exec:ok');
