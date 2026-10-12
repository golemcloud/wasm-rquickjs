const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
assert.equal(process.version, 'v22.14.0');
const fixtures = JSON.parse(spawnSync(process.argv[2], ['fixtures'], { encoding: 'utf8' }).stdout);
const privateCases = new Set(['pending-host-exit', 'post-ready-conversion', 'output-overflow',
  'exit-during-conversion', 'native-error-conversion', 'native-thrown-value',
  'future-retained-through-conversion', 'macro-generated-async-exit',
  'macro-generated-method-exit', 'macro-generated-method-borrow',
  'macro-generated-method-conversion-borrow']);
const reports = [];
for (const fixture of fixtures) {
  if (privateCases.has(fixture.name)) continue;
  const result = spawnSync(process.execPath, ['-e',
    "globalThis.markMutation=()=>process.stdout.write('unexpected\\n');" + fixture.source,
  ], { encoding: 'utf8', timeout: 5000 });
  assert.equal(result.error, undefined, fixture.name);
  assert.equal(result.status, fixture.code, fixture.name + ' exit status');
  assert.equal(result.stdout, fixture.stdout, fixture.name + ' stdout');
  assert.equal(result.stderr, fixture.stderr, fixture.name + ' stderr');
  reports.push({ name: fixture.name, exit_code: result.status, stdout: result.stdout, stderr: result.stderr });
}
console.log(JSON.stringify({ node: process.version, reports }, null, 2));
