'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { assemble, verify, render } = require('./measured-report.cjs');

const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const bytes = value => JSON.stringify(canonical(value), null, 2) + '\n';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const put = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes(value)); };
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const startTime = '2026-11-27T00:00:00Z';
const endTime = '2026-11-27T00:00:01Z';
function root(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'measured-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function sums(dir) {
  const result = {};
  function walk(current) {
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, item.name);
      if (item.isDirectory()) walk(file);
      else result[path.relative(dir, file)] = digest(fs.readFileSync(file));
    }
  }
  walk(dir); return result;
}
function entry(executionId, profile, names) {
  return { id: executionId, profile, filter: 'selected', consumer: 'local-wasmtime', artifactRole: 'candidate',
    lane: profile, workflowRun: 'fixture', workflowAttempt: 1, source: { revision: 'a'.repeat(40) },
    runner: { component: 'full-no-logging' }, inputs: {}, toolchain: { producerNode: 'fixture' },
    behaviorCases: names.filter(name => name !== 'import'),
    cases: names.map(name => ({ id: name, runnerName: `runner::${name}`, fixture: 'offline/test.js',
      classification: name === 'skip' ? 'known gap' : 'runnable', skipReason: name === 'skip' ? 'not implemented' : null,
      coverage: name === 'import' ? 'import' : 'unclassified', timeoutSeconds: 10, maxAttempts: 2 })) };
}
function setup(bundle, entries, selection = entries.map(item => item.id)) {
  put(path.join(bundle, 'plan.json'), { schemaVersion: 1, executions: entries });
  put(path.join(bundle, 'selection.json'), selection);
  for (const item of entries) {
    const dir = path.join(bundle, 'executions', item.id); fs.mkdirSync(dir, { recursive: true });
    if (item.profile !== 'bundled') for (let i = 0; i < item.cases.length; i++) put(path.join(dir, 'inventory', `${i}.json`), item.cases[i]);
  }
}
function capture(bundle, item, histories) {
  const dir = path.join(bundle, 'executions', item.id);
  const identity = digest(bytes(item));
  put(path.join(dir, 'run-start.json'), { identity, toolchain: item.toolchain, startedAt: startTime });
  fs.writeFileSync(path.join(dir, 'component.wasm'), item.id);
  put(path.join(dir, 'component.json'), { identity, algorithm: 'sha256', digest: digest(item.id), features: item.runner.component });
  for (const [caseId, history] of Object.entries(histories)) for (let index = 0; index < history.length; index++) {
    const outcome = history[index]; const binding = { identity, caseId, ordinal: index + 1 };
    const attempt = path.join(dir, 'attempts', caseId, String(index + 1));
    const phase = outcome === 'blocked' ? 'host-control' : 'guest';
    put(path.join(attempt, 'start.json'), { ...binding, startedAt: startTime });
    put(path.join(attempt, 'phase-0001-start.json'), { ...binding, phase, startedAt: startTime });
    if (outcome === 'not-run') continue;
    const reason = outcome === 'pass' ? '' : `${outcome} fixture`;
    put(path.join(attempt, 'phase-0001-finish.json'), { ...binding, phase, outcome: outcome === 'blocked' ? 'fail' : outcome, reason, finishedAt: endTime });
    fs.writeFileSync(path.join(attempt, 'phase-0001-stdout.txt'), `raw ${caseId} ${index + 1}`);
    fs.writeFileSync(path.join(attempt, 'phase-0001-stderr.txt'), '');
    put(path.join(attempt, 'finish.json'), { ...binding, outcome, reason, failedPhase: outcome === 'pass' ? null : phase, finishedAt: endTime });
  }
  if (item.profile !== 'bundled') put(path.join(dir, 'ctrf.json'), { results: { tests: item.cases.flatMap(current => {
    const outcome = histories[current.id]?.at(-1);
    if (!outcome || outcome === 'not-run') return current.classification === 'runnable' ? [] : [{ name: current.runnerName, status: 'skipped' }];
    return [{ name: current.runnerName, status: outcome === 'pass' ? 'passed' : 'failed' }];
  }) } });
  put(path.join(dir, 'run-finish.json'), { identity, outcome: 'fail', finishedAt: endTime });
  put(path.join(dir, 'evidence.json'), sums(dir));
}

test('six outcomes, flaky denominator, import limits and profile identities survive public assembly', t => {
  const bundle = root(t);
  const api = entry('api-run', 'api', ['same', 'flaky', 'failure', 'skip', 'timed', 'blocked', 'interrupted', 'import']);
  const installed = entry('installed-run', 'installed', ['same']);
  const missing = entry('missing-lane', 'bundled', ['same']);
  setup(bundle, [api, installed, missing]);
  capture(bundle, api, { same: ['pass'], flaky: ['fail', 'pass'], failure: ['fail'], timed: ['timeout'],
    blocked: ['blocked'], interrupted: ['not-run'], import: ['pass'] });
  capture(bundle, installed, { same: ['pass'] });
  const report = assemble(bundle); verify(bundle);
  assert.equal(report.complete, false);
  assert.deepEqual(report.totals, { selected: 10, pass: 4, fail: 1, skip: 1, timeout: 1, blocked: 1, 'not-run': 2,
    flakyPasses: 1, nonFlakyPasses: 3, properlyImplemented: 2, properlyImplementedPercent: 20, attempts: 9 });
  const flaky = report.executions.find(item => item.id === 'api-run').cases.find(item => item.id === 'flaky');
  assert.equal(flaky.outcome, 'pass'); assert.equal(flaky.flaky, true); assert.equal(flaky.qualified, false);
  assert.deepEqual(flaky.attempts.map(item => item.outcome), ['fail', 'pass']);
  assert.notDeepEqual(report.executions[0].cases.find(item => item.id === 'same').key,
    report.executions[1].cases.find(item => item.id === 'same').key);
  const markdown = render(JSON.parse(fs.readFileSync(path.join(bundle, 'report.json'))));
  assert.match(markdown, /Properly implemented\*: 2\/10 \(20%\)/);
  assert.match(markdown, /\| flaky \| behavior \| false \| pass \| true \| 2 \|/);
  assert.equal(fs.readFileSync(path.join(bundle, 'report.md'), 'utf8'), markdown);
  const first = fs.readFileSync(path.join(bundle, 'report.json'));
  const manifest = read(path.join(bundle, 'plan.json'));
  manifest.executions.reverse();
  put(path.join(bundle, 'plan.json'), manifest);
  const evidence = path.join(bundle, 'executions/api-run/attempts');
  for (const name of fs.readdirSync(evidence).reverse()) {
    fs.renameSync(path.join(evidence, name), path.join(evidence, `${name}.move`));
    fs.renameSync(path.join(evidence, `${name}.move`), path.join(evidence, name));
  }
  assemble(bundle);
  assert.deepEqual(fs.readFileSync(path.join(bundle, 'report.json')), first);
  assert.equal(fs.readFileSync(path.join(bundle, 'report.md'), 'utf8'), markdown);
});

test('a selected missing workflow rerun never borrows earlier green cases', t => {
  const bundle = root(t);
  const old = entry('old', 'bundled', ['same']); const latest = entry('latest', 'bundled', ['same']);
  latest.workflowAttempt = 2;
  setup(bundle, [old, latest], ['latest']); capture(bundle, old, { same: ['pass'] });
  const report = assemble(bundle); verify(bundle);
  assert.equal(report.executions.find(item => item.id === 'old').totals.pass, 1);
  assert.equal(report.totals.pass, 0); assert.equal(report.totals['not-run'], 1);
  assert.equal(report.totals.selected, 1); assert.equal(report.complete, false);

  const interrupted = root(t); const retry = entry('retry', 'bundled', ['same']);
  setup(interrupted, [retry]); capture(interrupted, retry, { same: ['not-run', 'pass'] });
  const recovered = assemble(interrupted); verify(interrupted);
  assert.equal(recovered.totals.flakyPasses, 1); assert.equal(recovered.totals.properlyImplemented, 0);
  assert.equal(recovered.complete, false, 'a missing earlier completion remains incomplete');
});

test('a failed shared preparation is blocked even after compilation; interruption stays not-run', t => {
  const bundle = root(t); const item = entry('compile-failure', 'api', ['same']); setup(bundle, [item]);
  const dir = path.join(bundle, 'executions', item.id); const identity = digest(bytes(item));
  put(path.join(dir, 'run-start.json'), { identity, toolchain: item.toolchain, startedAt: startTime });
  put(path.join(dir, 'component.json'), { identity, algorithm: 'sha256', digest: digest(item.id), features: item.runner.component });
  const phase = 'component-prepare';
  put(path.join(dir, 'prerequisites/prepare/start.json'), { identity, phase, startedAt: startTime });
  put(path.join(dir, 'prerequisites/prepare/finish.json'), { identity, phase, outcome: 'fail', reason: 'engine creation failed', finishedAt: endTime });
  put(path.join(dir, 'run-finish.json'), { identity, outcome: 'fail', exitCode: 101, finishedAt: endTime });
  fs.writeFileSync(path.join(dir, 'harness-stderr.txt'), 'Failed to compile node-compat-runner');
  put(path.join(dir, 'evidence.json'), sums(dir));
  const report = assemble(bundle); verify(bundle);
  assert.equal(report.totals.blocked, 1); assert.equal(report.totals.fail, 0);
  assert.equal(report.totals.pass, 0); assert.equal(report.totals.attempts, 0);
  fs.rmSync(path.join(dir, 'evidence.json'));
  fs.rmSync(path.join(dir, 'prerequisites/prepare/finish.json'));
  const interrupted = assemble(bundle);
  assert.equal(interrupted.totals['not-run'], 1); assert.equal(interrupted.totals.blocked, 0);
  assert.equal(interrupted.complete, false);
});

test('only explicitly declared behavior assertions qualify, and declarations reject unknown/import-only cases', t => {
  const bundle = root(t); const item = entry('surface', 'bundled', ['surface', 'assertions']);
  item.behaviorCases = ['assertions'];
  setup(bundle, [item]); capture(bundle, item, { surface: ['pass'], assertions: ['pass'] });
  const report = assemble(bundle); verify(bundle);
  assert.equal(report.totals.pass, 2); assert.equal(report.totals.properlyImplemented, 1);
  assert.equal(report.totals.properlyImplementedPercent, 50);
  assert.equal(report.executions[0].cases.find(item => item.id === 'surface').qualified, false);
  item.behaviorCases = ['unknown']; put(path.join(bundle, 'plan.json'), { schemaVersion: 1, executions: [item] });
  assert.throws(() => assemble(bundle), /behavior declaration/);
  item.cases[1].coverage = 'import'; item.behaviorCases = ['assertions'];
  put(path.join(bundle, 'plan.json'), { schemaVersion: 1, executions: [item] });
  assert.throws(() => assemble(bundle), /behavior declaration/);
});

test('corruption, duplicate attempts, contradictions and identity mixing are rejected', async t => {
  const base = root(t); const item = entry('run', 'bundled', ['same']);
  setup(base, [item]); capture(base, item, { same: ['pass'] }); assemble(base); verify(base);
  for (const [name, change] of [
    ['checksum', dir => fs.appendFileSync(path.join(dir, 'attempts/same/1/phase-0001-stdout.txt'), 'corrupt')],
    ['duplicate', dir => fs.cpSync(path.join(dir, 'attempts/same/1'), path.join(dir, 'attempts/same/copy'), { recursive: true })],
    ['contradiction', dir => { const file = path.join(dir, 'attempts/same/1/phase-0001-finish.json'); put(file, { ...read(file), outcome: 'fail' }); }],
    ['mixing', dir => { const file = path.join(dir, 'component.json'); put(file, { ...read(file), identity: 'different' }); }],
    ['unknown', dir => { const file = path.join(dir, 'attempts/same/1/start.json'); put(file, { ...read(file), caseId: 'unknown' }); }],
    ['missing-log', dir => fs.rmSync(path.join(dir, 'attempts/same/1/phase-0001-stdout.txt'))],
    ['ctrf-conflict', dir => put(path.join(dir, 'ctrf.json'), { results: { tests: [{ name: 'runner::same', status: 'failed' }] } })],
    ['ctrf-malformed', dir => fs.writeFileSync(path.join(dir, 'ctrf.json'), '{')],
    ['toolchain-drift', dir => { const file = path.join(dir, 'run-start.json'); put(file, { ...read(file), toolchain: { producerNode: 'other' } }); }],
    ['component-bytes', dir => fs.writeFileSync(path.join(dir, 'component.wasm'), 'wrong component')],
  ]) await t.test(name, child => {
    const copy = root(child); fs.cpSync(base, copy, { recursive: true });
    const dir = path.join(copy, 'executions/run');
    if (name !== 'checksum') fs.rmSync(path.join(dir, 'evidence.json'));
    change(dir);
    assert.throws(() => assemble(copy));
    assert.throws(() => verify(copy));
  });
});

// Exercise the public producer in a disposable checkout. External build/runtime commands
// are controlled, but plan/run, manifests, publication, drift checks and rendering are real.
function producer(t, api = false) {
  const dir = root(t);
  const write = (file, value) => {
    const destination = path.join(dir, file); fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, value);
  };
  for (const file of ['Cargo.toml', 'Cargo.lock', 'tools/dev-test.sh', 'tests/common/measured.rs',
    'tests/common/mod.rs', 'tests/node_compat.rs', 'tests/runtime/node_modules_apps.rs',
    'crates/wasm-rquickjs/skeleton/Cargo.toml_', 'crates/wasm-rquickjs/skeleton/Cargo.lock',
    'tests/node_modules_apps/config.jsonc', 'tests/node_modules_apps/apps/demo/test.js',
    'tests/libraries/ajv/test-01-basic.js', 'tests/libraries/ajv/package.json']) write(file, 'fixture');
  write('tools/measured-report.cjs', fs.readFileSync(path.join(__dirname, 'measured-report.cjs')));
  if (api) for (const [file, value] of Object.entries({ 'suite/NODE_VERSION': '26.13.1',
    'suite/parallel/test.js': 'assertions', 'suite/common/helper.mjs': 'original helper',
    'suite/trace_events/extra.js': 'additional setup input',
    'config.jsonc': '{}', 'vendor.sh': 'fixture' })) write(`tests/node_compat/${file}`, value);
  const stub = `#!${process.execPath}
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const args = process.argv.slice(2), command = path.basename(process.argv[1]);
const root = ${JSON.stringify(dir)};
if (args.includes('--version')) { console.log(command + (process.env.STUB_VERSION || '-1')); process.exit(0); }
if (command === 'git') {
  if (args[0] === 'rev-parse') console.log('a'.repeat(40));
  else if (args[0] === 'ls-files') {
    const prefix = args.at(-1);
    const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(item => item.isDirectory()
      ? walk(path.join(dir,item.name)) : [path.join(dir,item.name)]);
    process.stdout.write(walk(path.join(root,prefix)).map(file => path.relative(root,file)).join('\\0'));
  }
} else if (command === 'bash' && args.includes('--list')) {
  const filter = process.env.WASM_RQUICKJS_MEASURE_FILTER, api = args.includes('node_compat');
  const name = (api ? 'node_compat::gen_node_compat_tests::' : 'runtime::node_modules_apps::gen_node_modules_app_tests::') + filter;
  const inventory = path.join(process.env.WASM_RQUICKJS_MEASURE_DIR,'inventory'); fs.mkdirSync(inventory,{recursive:true});
  if (api) fs.writeFileSync(path.join(process.env.WASM_RQUICKJS_MEASURE_DIR,'input-roots.json'),
    JSON.stringify(['tests/node_compat/suite/common','tests/node_compat/suite/trace_events']));
  fs.writeFileSync(path.join(inventory,'case.json'),JSON.stringify({id:filter,runnerName:name,
    fixture:api?'parallel/test.js':'demo/test.js',classification:'runnable',skipReason:null,
    coverage:'unclassified',maxAttempts:1,timeoutSeconds:10}));
  console.log(name); if (filter === 'unmeasured') console.log('node_compat::static_test');
} else if (command === 'wasm-rquickjs') {
  const output = args[args.indexOf('--output')+1]; fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,'Cargo.toml'),'[package]\\nname = "lib-ajv"\\n[lib]\\n');
} else if (command === 'cargo' && args.includes('--target')) {
  const manifest = fs.readFileSync('Cargo.toml','utf8');
  const name = manifest.match(/\\[lib\\]\\n(?:name = "([^"]+)"\\n)?/)[1] || 'lib_ajv';
  const output = path.join(root,'target/wasm32-wasip2/debug'); fs.mkdirSync(output,{recursive:true});
  if (!process.env.STUB_MISSING_OUTPUT) fs.writeFileSync(path.join(output,name+'.wasm'),'component:'+name);
  if (process.env.STUB_FAIL_BUILD) process.exit(17);
} else if (command === 'wasmtime') {
  // A subsequent fixture replaces the old shared-world output before invocation.
  fs.writeFileSync(path.join(root,'target/wasm32-wasip2/debug/lib_ajv.wasm'),'another fixture');
  const component = args.at(-1);
  assert(!component.includes('/target/'), 'must execute retained component');
  assert(fs.readFileSync(component,'utf8').startsWith('component:measured_'), 'must publish execution-specific output');
  console.log(JSON.stringify('PASS: isolated component'));
}
`;
  for (const command of ['git', 'bash', 'cargo', 'rustc', 'node', 'npm', 'wasmtime']) {
    write(`bin/${command}`, stub); fs.chmodSync(path.join(dir, 'bin', command), 0o755);
  }
  write('target/debug/wasm-rquickjs', stub); fs.chmodSync(path.join(dir, 'target/debug/wasm-rquickjs'), 0o755);
  const call = (args, env = {}) => spawnSync(process.execPath, [path.join(dir, 'tools/measured-report.cjs'), ...args],
    { cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: path.join(dir, 'bin'), ...env } });
  return { dir, write, call, bundle: path.join(dir, 'bundle') };
}

test('public plan/run isolates bundled outputs, survives old locks, and does not require the API suite', t => {
  const p = producer(t);
  fs.mkdirSync(path.join(p.dir, 'tmp/measured-bundled-build.lock'), { recursive: true });
  for (const id of ['first', 'second']) {
    assert.equal(p.call(['plan', p.bundle, id, 'bundled', 'ajv/test-01-basic.js']).status, 0);
    // API-suite changes cannot invalidate an unrelated package plan.
    p.write('tests/node_compat/suite/NODE_VERSION', id);
    const result = p.call(['run', p.bundle, id]); assert.equal(result.status, 0, result.stderr);
  }
  const first = fs.readFileSync(path.join(p.bundle, 'executions/first/component.wasm'));
  const second = fs.readFileSync(path.join(p.bundle, 'executions/second/component.wasm'));
  assert.notDeepEqual(first, second);
  assert.equal(p.call(['assemble', p.bundle]).status, 0);
  assert.equal(p.call(['verify', p.bundle]).status, 0);
  const report = read(path.join(p.bundle, 'report.json'));
  assert.equal(report.executions.length, 2); assert(report.executions.every(item => item.cases[0].outcome === 'pass'));
  assert.equal(report.totals.properlyImplemented, 0, 'undeclared passes never qualify');
  assert.match(fs.readFileSync(path.join(p.bundle, 'report.md'), 'utf8'), /unclassified \| false \| pass/);
  assert.equal(p.call(['plan', p.bundle, 'failed', 'bundled', 'ajv/test-01-basic.js']).status, 0);
  assert.equal(p.call(['run', p.bundle, 'failed'], { STUB_FAIL_BUILD: '1' }).status, 1);
  assert(!fs.existsSync(path.join(p.bundle, 'executions/failed/component.wasm')), 'failed builds must not publish');
  const finish = read(path.join(p.bundle, 'executions/failed/attempts/bundled/0001/finish.json'));
  assert.equal(finish.outcome, 'blocked'); assert.equal(finish.failedPhase, 'component-build');
  const failedBuild = read(path.join(p.bundle, 'executions/failed/attempts/bundled/0001/phase-0006-finish.json'));
  assert.equal(failedBuild.exitCode, 17); assert.equal(failedBuild.publicationError, null);

  assert.equal(p.call(['plan', p.bundle, 'missing-output', 'bundled', 'ajv/test-01-basic.js']).status, 0);
  assert.equal(p.call(['run', p.bundle, 'missing-output'], { STUB_MISSING_OUTPUT: '1' }).status, 1);
  const publication = read(path.join(p.bundle, 'executions/missing-output/attempts/bundled/0001/phase-0006-finish.json'));
  assert.equal(publication.exitCode, 0, 'publication errors must preserve the actual successful build exit');
  assert.equal(publication.error, null); assert.match(publication.publicationError, /ENOENT/);
  assert.equal(p.call(['select', p.bundle, 'missing-output']).status, 0);
  assert.equal(p.call(['assemble', p.bundle]).status, 0);
  assert.equal(p.call(['verify', p.bundle]).status, 0);
  const missing = read(path.join(p.bundle, 'report.json'));
  assert.equal(missing.totals.blocked, 1); assert.equal(missing.totals.pass, 0);
  assert.match(missing.executions.find(item => item.id === 'missing-output').cases[0].reason, /ENOENT/);
});

test('public plan/run requires only profile tools and rejects drift or unmeasured selection before invocation', t => {
  const p = producer(t, true);
  assert.equal(p.call(['plan', p.bundle, 'drift', 'api', 'case']).status, 0);
  const drift = p.call(['run', p.bundle, 'drift'], { STUB_VERSION: '-changed' });
  assert.equal(drift.status, 1); assert.match(drift.stderr, /toolchain changed/);
  assert(!fs.existsSync(path.join(p.bundle, 'executions/drift/run-start.json')));
  assert.equal(p.call(['plan', p.bundle, 'input', 'api', 'case']).status, 0);
  p.write('tests/node_compat/suite/common/helper.mjs', 'changed helper');
  const changed = p.call(['run', p.bundle, 'input']);
  assert.equal(changed.status, 1); assert.match(changed.stderr, /fixture input changed/);
  assert(!fs.existsSync(path.join(p.bundle, 'executions/input/run-start.json')));
  assert.equal(p.call(['plan', p.bundle, 'new-root', 'api', 'case']).status, 0);
  p.write('tests/node_compat/suite/trace_events/extra.js', 'changed additional setup input');
  const extra = p.call(['run', p.bundle, 'new-root']);
  assert.equal(extra.status, 1); assert.match(extra.stderr, /fixture input changed/);
  assert(!fs.existsSync(path.join(p.bundle, 'executions/new-root/run-start.json')));
  assert.equal(p.call(['plan', p.bundle, 'bad', 'api', 'unmeasured']).status, 1);
  assert.equal(p.call(['plan', p.bundle, 'tag', 'api', ':tag:shard0']).status, 1);
  fs.rmSync(path.join(p.dir, 'bin/npm')); fs.rmSync(path.join(p.dir, 'bin/wasmtime'));
  assert.equal(p.call(['plan', p.bundle, 'minimal', 'api', 'case']).status, 0, 'API needs neither npm nor CLI Wasmtime');
  fs.rmSync(path.join(p.dir, 'tests/node_compat/suite'), { recursive: true });
  // Restore npm only: installed execution needs neither vendored API files nor the Wasmtime CLI.
  fs.copyFileSync(path.join(p.dir, 'bin/node'), path.join(p.dir, 'bin/npm'));
  fs.chmodSync(path.join(p.dir, 'bin/npm'), 0o755);
  assert.equal(p.call(['plan', p.bundle, 'installed', 'installed', 'case']).status, 0);
  const installed = p.call(['run', p.bundle, 'installed']); assert.equal(installed.status, 0, installed.stderr);
});
