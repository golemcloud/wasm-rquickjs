import { writeFileSync } from 'node:fs';

writeFileSync('/workspace/npm-run-result.json', JSON.stringify({
  argv: process.argv,
  cwd: process.cwd(),
  lifecycleEvent: process.env.npm_lifecycle_event,
}));
console.log('npm-run:ok');
