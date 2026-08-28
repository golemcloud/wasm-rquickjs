const fs = require('node:fs');

fs.writeFileSync('/workspace/lifecycle-result.json', JSON.stringify({
  cwd: process.cwd(),
  lifecycleEvent: process.env.npm_lifecycle_event,
  packageName: process.env.npm_package_name,
}));
console.log('npm-lifecycle:ok');
