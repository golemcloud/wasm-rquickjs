#!/usr/bin/env node
import { writeFileSync } from 'node:fs';

writeFileSync('/workspace/npm-registry-exec-result.json', JSON.stringify({
  argv: process.argv,
  cwd: process.cwd(),
}));
console.log('npm-registry-exec:ok');
