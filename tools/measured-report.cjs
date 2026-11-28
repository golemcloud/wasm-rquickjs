#!/usr/bin/env node
// Local evidence only. No agents, uploads, classification changes or CI selection changes.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..');
const OUTCOMES = ['pass', 'fail', 'skip', 'timeout', 'blocked', 'not-run'];
const PROFILES = ['api', 'installed', 'bundled'];
const text = file => fs.readFileSync(file, 'utf8');
const read = file => JSON.parse(text(file));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
const json = value => JSON.stringify(sorted(value), null, 2) + '\n';
const save = (file, value, flag = 'wx') => fs.writeFileSync(file, json(value), { flag });
const now = () => new Date().toISOString();
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const relative = (root, file) => path.relative(root, file).split(path.sep).join('/');
const id = value => { assert.match(value, /^[a-zA-Z0-9_-]+$/, 'unsafe execution ID'); return value; };
function files(dir, fixtureInputs = false) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => compare(a.name, b.name))
    .flatMap(item => {
      const file = path.join(dir, item.name);
      if (item.isSymbolicLink()) {
        assert(fixtureInputs, 'symlink in evidence');
        assert(fs.realpathSync(file).startsWith(path.join(ROOT, 'tests/node_compat') + path.sep), 'fixture link leaves fixture tree');
      }
      return fs.statSync(file).isDirectory() ? files(file, fixtureInputs) : [file];
    });
}
function apiInputs(cases, roots) {
  // Guest setup publishes its own input roots; retain their superset, including ignored files.
  const inputs = new Set(['tests/node_compat/suite/NODE_VERSION', ...cases.map(item => `tests/node_compat/suite/${item.fixture}`)]);
  assert(Array.isArray(roots) && roots.length, 'missing guest setup input roots');
  for (const directory of roots) {
    assert(typeof directory === 'string' && directory.startsWith('tests/node_compat/'), 'invalid guest setup input root');
    for (const file of files(within(ROOT, directory), true)) inputs.add(relative(ROOT, file));
  }
  return [...inputs].sort();
}
function checkInstalledInputs(entry) {
  for (const fixture of new Set(entry.cases.map(item => item.fixture.split('/')[0]))) {
    const root = within(ROOT, `tests/node_modules_apps/apps/${fixture}`);
    for (const file of files(root)) {
      const input = `inputs/${relative(ROOT, file)}`;
      assert(Object.hasOwn(entry.inputs, input), `uncaptured installed fixture input: ${input}`);
    }
  }
}
function within(root, relative) {
  assert(typeof relative === 'string' && relative && !relative.includes('\\') && !path.isAbsolute(relative));
  assert(!relative.split('/').some(part => !part || part === '.' || part === '..'), 'unsafe evidence path');
  const file = path.join(root, relative);
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (fs.existsSync(current)) assert(!fs.lstatSync(current).isSymbolicLink(), 'symlink in evidence');
  }
  return file;
}
function checksums(dir, exclude = []) {
  return Object.fromEntries(files(dir).map(file => [relative(dir, file), hash(fs.readFileSync(file))])
    .filter(([relative]) => !exclude.includes(relative)));
}
function checkDigests(dir, expected, exact = false, exclude = []) {
  assert(expected && typeof expected === 'object' && !Array.isArray(expected), 'missing checksums');
  for (const [relative, digest] of Object.entries(expected)) {
    assert.match(digest, /^[0-9a-f]{64}$/);
    assert.equal(hash(fs.readFileSync(within(dir, relative))), digest, `digest mismatch: ${relative}`);
  }
  if (exact) assert.deepEqual(checksums(dir, exclude), expected, 'missing or unclaimed evidence');
}
function commandVersion(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : 'unavailable';
}
function toolchain(profile) {
  return { producerNode: process.version, rustc: commandVersion('rustc', ['--version']),
    cargo: commandVersion('cargo', ['--version']),
    ...(profile === 'api' ? { apiTarget: text(path.join(ROOT, 'tests/node_compat/suite/NODE_VERSION')).trim() }
      : { nodeControl: commandVersion('node', ['--version']), npm: commandVersion('npm', ['--version']) }),
    ...(profile === 'bundled' ? { wasmtime: commandVersion('wasmtime', ['--version']) } : {}) };
}
function source() {
  const revision = commandVersion('git', ['rev-parse', 'HEAD']);
  assert.match(revision, /^[0-9a-f]{40}$/);
  const patch = spawnSync('git', ['diff', '--binary', 'HEAD'], { cwd: ROOT });
  assert.equal(patch.status, 0);
  // Include the producer even before its first commit; never copy arbitrary untracked files.
  const producer = ['tools/measured-report.cjs', 'tests/common/measured.rs', 'tests/common/mod.rs',
    'tests/node_compat.rs', 'tests/runtime/node_modules_apps.rs'].map(file => [file, hash(fs.readFileSync(path.join(ROOT, file)))]);
  return { revision, dirtyPatchSha256: hash(patch.stdout), producerInputs: Object.fromEntries(producer) };
}
function validatePlan(plan) {
  assert.equal(plan.schemaVersion, 1);
  assert(Array.isArray(plan.executions));
  const ids = new Set();
  for (const entry of plan.executions) {
    id(entry.id); assert(!ids.has(entry.id), 'duplicate execution'); ids.add(entry.id);
    assert(PROFILES.includes(entry.profile), 'unknown profile');
    assert([entry.consumer, entry.artifactRole, entry.lane, entry.workflowRun].every(value => typeof value === 'string' && value));
    assert(Number.isSafeInteger(entry.workflowAttempt) && entry.workflowAttempt >= 1);
    assert.match(entry.source.revision, /^[0-9a-f]{40}$/);
    assert(Array.isArray(entry.cases) && entry.cases.length, 'empty expected inventory');
    assert(Array.isArray(entry.behaviorCases) && new Set(entry.behaviorCases).size === entry.behaviorCases.length, 'invalid behavior declaration');
    assert(entry.behaviorCases.every(name => entry.cases.some(item => item.id === name && item.coverage !== 'import')), 'unknown/import-only behavior declaration');
    const cases = new Set();
    for (const item of entry.cases) {
      assert(typeof item.id === 'string' && item.id && !cases.has(item.id), 'duplicate/invalid case ID'); cases.add(item.id);
      assert(item.runnerName && item.fixture && ['unclassified', 'behavior', 'import'].includes(item.coverage));
      assert(typeof item.classification === 'string' && item.classification);
      if (item.classification !== 'runnable') assert(item.skipReason, 'skip needs reason');
      assert(Number.isSafeInteger(item.maxAttempts) && item.maxAttempts > 0);
      assert(Number.isFinite(item.timeoutSeconds) && item.timeoutSeconds > 0);
    }
  }
}
function environment(entry, dir) {
  return { ...process.env, CARGO_INCREMENTAL: '0', WASM_RQUICKJS_MEASURE_DIR: dir,
    WASM_RQUICKJS_MEASURE_FILTER: entry.filter,
    ...(entry.profile === 'installed' ? { NODE_MODULES_APP_STRICT_NODE_BASELINE: '1' } : {}) };
}
function harness(entry, extra) {
  return ['tools/dev-test.sh', 'stock', 'fast-run', entry.profile === 'api' ? 'node_compat' : 'runtime', entry.filter, ...extra];
}
function execute(dir, name, command, cwd, env, timeoutSeconds = 0, binding = {}, publication = null) {
  const startedAt = now();
  save(path.join(dir, `${name}-start.json`), { ...binding, command, startedAt, timeoutSeconds });
  const stdout = fs.openSync(path.join(dir, `${name}-stdout.txt`), 'wx');
  const stderr = fs.openSync(path.join(dir, `${name}-stderr.txt`), 'wx');
  let result;
  let publicationError = null;
  try {
    result = spawnSync(command[0], command.slice(1), { cwd, env, stdio: ['ignore', stdout, stderr],
      ...(timeoutSeconds ? { timeout: timeoutSeconds * 1000, killSignal: 'SIGKILL' } : {}) });
  } catch (error) { result = { status: null, signal: null, error }; }
  finally {
    fs.closeSync(stdout); fs.closeSync(stderr);
  }
  if (publication && result.status === 0) {
    try { fs.copyFileSync(publication.source, publication.destination, fs.constants.COPYFILE_EXCL); }
    catch (error) { publicationError = error.message; }
  }
  const finish = { ...binding, command, startedAt, finishedAt: now(), exitCode: result.status,
    signal: result.signal, error: result.error?.message || null, publicationError,
    outcome: result.error?.code === 'ETIMEDOUT' ? 'timeout' : result.status === 0 && !publicationError ? 'pass' : 'fail' };
  if (binding.phase === 'guest' && finish.outcome === 'pass') {
    const last = text(path.join(dir, `${name}-stdout.txt`)).trim().split(/\r?\n/).at(-1);
    try { finish.returned = JSON.parse(last); } catch { finish.returned = last; }
    if (typeof finish.returned !== 'string' || !finish.returned.startsWith('PASS')) {
      finish.outcome = 'fail'; finish.error = 'guest run() did not return PASS';
    }
  }
  save(path.join(dir, `${name}-finish.json`), finish);
  return finish;
}

function plan(bundle, executionId, profile, filter, metadata = {}) {
  id(executionId); assert(PROFILES.includes(profile)); assert(filter && !filter.startsWith('-'), 'a narrow filter is required');
  assert(!filter.startsWith(':tag:'), 'select generated case names, not tags');
  assert(Object.keys(metadata).every(key => ['consumer', 'artifactRole', 'lane', 'workflowRun', 'workflowAttempt', 'behaviorCases'].includes(key)), 'unknown metadata');
  fs.mkdirSync(bundle, { recursive: true });
  const planFile = path.join(bundle, 'plan.json');
  const existing = fs.existsSync(planFile) ? read(planFile) : { schemaVersion: 1, executions: [] };
  assert(!existing.executions.some(entry => entry.id === executionId), 'execution already planned');
  const dir = path.join(bundle, 'executions', executionId);
  fs.mkdirSync(dir, { recursive: true });
  const entry = { id: executionId, profile, filter, consumer: 'local-wasmtime', artifactRole: 'candidate',
    lane: profile, workflowRun: 'local', workflowAttempt: 1, behaviorCases: [], ...metadata, source: source(),
    toolchain: toolchain(profile),
    runner: { host: 'stock', profile: 'fast-run', component: profile === 'api' ? 'full-no-logging-golem-typescript' : 'full-no-logging' } };
  assert(Object.values(entry.toolchain).every(value => value !== 'unavailable'), 'install the recorded toolchain before planning');
  if (profile === 'bundled') {
    assert.match(filter, /^[a-zA-Z0-9_-]+\/test-\d[^/]*\.js$/, 'select an existing offline behavior fixture');
    assert(fs.existsSync(path.join(ROOT, 'tests/libraries', filter)));
    entry.runner = { host: 'wasmtime-cli', profile: 'debug-unoptimized', component: 'full-no-logging-p3' };
    entry.cases = [{ id: filter, runnerName: filter, fixture: filter, classification: 'runnable', skipReason: null,
      coverage: 'unclassified', maxAttempts: 1, timeoutSeconds: 60 }];
  } else {
    const discovery = execute(dir, 'discovery', ['bash', ...harness(entry, ['--list'])], ROOT, environment(entry, dir));
    assert.equal(discovery.outcome, 'pass', 'inventory discovery failed; see raw discovery logs');
    entry.cases = files(path.join(dir, 'inventory')).map(read).sort((a, b) => compare(a.id, b.id));
    const listed = text(path.join(dir, 'discovery-stdout.txt')).split(/\r?\n/).filter(line => /^\S+::\S+$/.test(line)).sort();
    assert.deepEqual(listed, entry.cases.map(item => item.runnerName).sort(), 'filter selects tests outside measured inventory');
  }
  const inputs = new Set(['Cargo.toml', 'Cargo.lock', 'tools/dev-test.sh',
    'crates/wasm-rquickjs/skeleton/Cargo.toml_', 'crates/wasm-rquickjs/skeleton/Cargo.lock',
    ...Object.keys(entry.source.producerInputs)]);
  if (profile === 'api') {
    inputs.add('tests/node_compat/config.jsonc'); inputs.add('tests/node_compat/vendor.sh');
    entry.apiInputRoots = read(path.join(dir, 'input-roots.json'));
    entry.apiInputs = apiInputs(entry.cases, entry.apiInputRoots);
    for (const file of entry.apiInputs) inputs.add(file);
  } else {
    if (profile === 'installed') inputs.add('tests/node_modules_apps/config.jsonc');
    const fixtures = new Set(entry.cases.map(item => item.fixture.split('/')[0]));
    for (const fixture of fixtures) {
      const prefix = `tests/${profile === 'installed' ? 'node_modules_apps/apps' : 'libraries'}/${fixture}/`;
      const result = spawnSync('git', ['ls-files', '-z', '--', prefix], { cwd: ROOT, encoding: 'utf8' });
      assert.equal(result.status, 0);
      for (const file of result.stdout.split('\0').filter(Boolean)) if (profile === 'installed' || !file.endsWith('results.md')) inputs.add(file);
    }
  }
  entry.inputs = {};
  for (const relative of [...inputs].sort()) {
    const destination = within(dir, `inputs/${relative}`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(ROOT, relative), destination, fs.constants.COPYFILE_EXCL);
    entry.inputs[`inputs/${relative}`] = hash(fs.readFileSync(destination));
  }
  if (profile === 'installed') checkInstalledInputs(entry);
  existing.executions.push(entry);
  validatePlan(existing);
  save(planFile, existing, 'w');
  fs.writeFileSync(path.join(dir, 'identity.txt'), hash(json(entry)), { flag: 'wx' });
  const selectionFile = path.join(bundle, 'selection.json');
  const selection = fs.existsSync(selectionFile) ? read(selectionFile) : [];
  // Reruns stay retained but must be selected explicitly, never picked by outcome.
  if (!existing.executions.some(old => old.id !== entry.id && old.profile === profile && old.lane === entry.lane &&
    old.artifactRole === entry.artifactRole && old.consumer === entry.consumer)) selection.push(entry.id);
  save(selectionFile, selection, 'w');
  return entry;
}

function runBundled(entry, dir) {
  const [library, fixture] = entry.filter.split('/');
  const work = path.join(ROOT, 'tmp', `measured-${entry.id}`);
  assert(!fs.existsSync(work), 'fixture work directory already exists');
  fs.mkdirSync(work, { recursive: true });
  const app = path.join(work, 'app'); fs.mkdirSync(app);
  for (const relative of Object.keys(entry.inputs)) {
    const prefix = `inputs/tests/libraries/${library}/`;
    if (relative.startsWith(prefix)) {
      const destination = within(app, relative.slice(prefix.length));
      fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.copyFileSync(within(dir, relative), destination);
    }
  }
  const attemptDir = path.join(dir, 'attempts', 'bundled', '0001'); fs.mkdirSync(attemptDir, { recursive: true });
  const identity = hash(json(entry));
  const componentName = `measured_${identity}`;
  const binding = { identity, caseId: entry.filter, ordinal: 1 };
  save(path.join(attemptDir, 'start.json'), { ...binding, startedAt: now() });
  const bundle = path.join(app, 'dist', fixture.replace('.js', '.bundle.js'));
  const component = path.join(work, 'component');
  const wasm = path.join(dir, 'component.wasm');
  const guestRoot = path.join(work, 'guest'); fs.mkdirSync(guestRoot);
  const phases = [
    ['installation', ['npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], app],
    ['bundling', ['node', 'node_modules/rollup/dist/bin/rollup', '-c', 'rollup.config.mjs'], app],
    ['host-control', ['node', 'run-node.mjs', `./dist/${path.basename(bundle)}`], app],
    ['producer-build', ['cargo', 'build', '--locked', '--bin', 'wasm-rquickjs', '--features', 'wasm-rquickjs/external-skeleton'], ROOT],
    ['generation', [path.join(ROOT, 'target/debug/wasm-rquickjs'), 'generate-wrapper-crate', '--js', bundle,
      '--wit', path.join(app, 'wit'), '--output', component], ROOT],
    ['component-build', ['cargo', 'build', '--locked', '--target', 'wasm32-wasip2',
      '--no-default-features', '--features', 'full-no-logging-p3'], component],
    ['guest', ['wasmtime', 'run', '--wasm', 'component-model', '--wasm', 'component-model-async',
      '-S', 'cli', '-S', 'p3', '-S', 'http', '-S', 'inherit-network', '--dir', `${guestRoot}::/`, '--invoke', 'run()'], ROOT],
  ];
  let final = { outcome: 'pass', reason: '', failedPhase: null };
  for (let i = 0; i < phases.length; i++) {
    const [phase, command, cwd] = phases[i];
    let publication = null;
    if (phase === 'component-build') {
      // Cargo's lock ends before publication. Give each execution its own output name,
      // so another fixture cannot overwrite it between build, copy, hash and invocation.
      const manifest = path.join(component, 'Cargo.toml');
      const generated = text(manifest);
      assert(generated.includes('[lib]\n'), 'generated library manifest missing');
      fs.writeFileSync(manifest, generated.replace('[lib]\n', `[lib]\nname = "${componentName}"\n`));
      publication = { source: path.join(ROOT, 'target', 'wasm32-wasip2', 'debug', `${componentName}.wasm`), destination: wasm };
    }
    if (phase === 'guest') {
      save(path.join(dir, 'component.json'), { identity, algorithm: 'sha256', digest: hash(fs.readFileSync(wasm)), features: entry.runner.component });
      command.push(wasm);
    }
    const prefix = `phase-${String(i + 1).padStart(4, '0')}`;
    const result = execute(attemptDir, prefix, command, cwd, { ...process.env, CARGO_INCREMENTAL: '0', CARGO_TARGET_DIR: path.join(ROOT, 'target') },
      phase === 'guest' ? entry.cases[0].timeoutSeconds : 1800, { ...binding, phase }, publication);
    if (result.outcome !== 'pass') {
      final = { outcome: phase === 'guest' ? result.outcome : 'blocked', reason: `failed ${phase}: ${result.publicationError || result.error || result.exitCode}`, failedPhase: phase };
      break;
    }
  }
  save(path.join(attemptDir, 'finish.json'), { ...binding, ...final, finishedAt: now() });
  return final;
}

function checkLiveInputs(entry, dir) {
  assert.deepEqual(source(), entry.source, 'source changed since inventory; plan a new execution');
  assert.deepEqual(toolchain(entry.profile), entry.toolchain, 'toolchain changed since inventory; plan a new execution');
  if (entry.profile === 'api') assert.deepEqual(apiInputs(entry.cases, entry.apiInputRoots), entry.apiInputs, 'supporting fixture inventory changed');
  if (entry.profile === 'installed') checkInstalledInputs(entry);
  checkDigests(dir, entry.inputs);
  for (const [relative, digest] of Object.entries(entry.inputs)) {
    // Input symlinks are dereferenced just as fs::copy does in guest setup; retained evidence has no symlinks.
    assert.equal(hash(fs.readFileSync(path.join(ROOT, relative.slice('inputs/'.length)))), digest, 'fixture input changed since inventory');
  }
}
function run(bundle, executionId) {
  const manifest = read(path.join(bundle, 'plan.json')); validatePlan(manifest);
  const entry = manifest.executions.find(item => item.id === executionId); assert(entry, 'unknown execution');
  const dir = path.join(bundle, 'executions', id(executionId));
  checkLiveInputs(entry, dir);
  assert.equal(text(path.join(dir, 'identity.txt')), hash(json(entry)));
  save(path.join(dir, 'run-start.json'), { identity: hash(json(entry)), toolchain: toolchain(entry.profile), startedAt: now() });
  let result;
  if (entry.profile === 'bundled') {
    result = runBundled(entry, dir);
  } else {
    result = execute(dir, 'harness', ['bash', ...harness(entry, ['--format', 'ctrf', '--logfile', path.join(dir, 'ctrf.json')])], ROOT, environment(entry, dir));
  }
  checkLiveInputs(entry, dir);
  save(path.join(dir, 'run-finish.json'), { identity: hash(json(entry)), ...result, finishedAt: now() });
  save(path.join(dir, 'evidence.json'), checksums(dir, ['evidence.json']));
  return result;
}

function totals(cases) {
  const result = Object.fromEntries(OUTCOMES.map(outcome => [outcome, cases.filter(item => item.outcome === outcome).length]));
  result.selected = cases.length;
  result.flakyPasses = cases.filter(item => item.outcome === 'pass' && item.flaky).length;
  result.nonFlakyPasses = result.pass - result.flakyPasses;
  result.properlyImplemented = cases.filter(item => item.qualified).length;
  result.properlyImplementedPercent = cases.length ? Number((100 * result.properlyImplemented / cases.length).toFixed(2)) : 0;
  result.attempts = cases.reduce((sum, item) => sum + item.attempts.length, 0);
  return result;
}
function normalize(bundle) {
  const plan = read(path.join(bundle, 'plan.json')); validatePlan(plan);
  const selection = read(path.join(bundle, 'selection.json'));
  assert(Array.isArray(selection) && new Set(selection).size === selection.length, 'duplicate selection');
  assert(selection.every(value => plan.executions.some(entry => entry.id === value)), 'unknown selected execution');
  const groups = new Set();
  const executions = [...plan.executions].sort((a, b) => compare(a.id, b.id)).map(entry => {
    const dir = path.join(bundle, 'executions', entry.id);
    const identity = hash(json(entry));
    const selected = selection.includes(entry.id);
    const group = json([entry.artifactRole, entry.consumer, entry.profile, entry.lane]);
    if (selected) { assert(!groups.has(group), 'multiple selected executions for one lane/profile/artifact role'); groups.add(group); }
    const sealed = fs.existsSync(path.join(dir, 'evidence.json'));
    if (sealed) checkDigests(dir, read(path.join(dir, 'evidence.json')), true, ['evidence.json']);
    checkDigests(dir, entry.inputs);
    const component = fs.existsSync(path.join(dir, 'component.json')) ? read(path.join(dir, 'component.json')) : null;
    if (component) {
      assert.equal(component.identity, identity, 'cross-artifact component'); assert.match(component.digest, /^[0-9a-f]{64}$/);
      assert(['sha256', 'blake3'].includes(component.algorithm));
      assert.equal(component.features, entry.runner.component, 'component feature mismatch');
      if (entry.profile === 'bundled') {
        assert.equal(component.algorithm, 'sha256');
        assert.equal(component.digest, hash(fs.readFileSync(path.join(dir, 'component.wasm'))), 'published component digest mismatch');
      }
    }
    const runStart = fs.existsSync(path.join(dir, 'run-start.json')) ? read(path.join(dir, 'run-start.json')) : null;
    if (runStart) {
      assert.equal(runStart.identity, identity, 'cross-execution start');
      assert.deepEqual(runStart.toolchain, entry.toolchain, 'execution toolchain mismatch');
    }
    const runFinish = fs.existsSync(path.join(dir, 'run-finish.json')) ? read(path.join(dir, 'run-finish.json')) : null;
    if (runFinish) {
      assert.equal(runFinish.identity, identity, 'cross-execution result');
      assert(runStart && Date.parse(runFinish.finishedAt) >= Date.parse(runStart.startedAt), 'completion without valid run start');
    }
    if (entry.profile !== 'bundled') {
      const inventory = files(path.join(dir, 'inventory')).map(read).sort((a, b) => compare(a.id, b.id));
      assert.deepEqual(inventory, [...entry.cases].sort((a, b) => compare(a.id, b.id)), 'inventory drift');
    }
    const prerequisites = files(path.join(dir, 'prerequisites')).filter(file => path.basename(file) === 'start.json').map(file => {
      const start = read(file);
      assert.equal(start.identity, identity, 'cross-execution prerequisite');
      assert(runStart && Date.parse(start.startedAt) >= Date.parse(runStart.startedAt), 'prerequisite without run start');
      const finishFile = path.join(path.dirname(file), 'finish.json');
      const finish = fs.existsSync(finishFile) ? read(finishFile) : null;
      if (finish) {
        assert.equal(finish.identity, identity); assert.equal(finish.phase, start.phase);
        assert(['pass', 'fail'].includes(finish.outcome));
        assert(Date.parse(finish.finishedAt) >= Date.parse(start.startedAt));
        if (finish.outcome === 'fail') assert(finish.reason);
      }
      return { ...start, ...finish, outcome: finish?.outcome || 'not-run', evidence: relative(bundle, file) };
    });
    for (const file of files(path.join(dir, 'prerequisites')).filter(file => path.basename(file) === 'finish.json')) {
      assert(fs.existsSync(path.join(path.dirname(file), 'start.json')), 'prerequisite completion without start');
    }
    const starts = files(path.join(dir, 'attempts')).filter(file => path.basename(file) === 'start.json');
    const attempts = starts.map(startFile => {
      const start = read(startFile); const attemptDir = path.dirname(startFile);
      assert(runStart, 'attempt without execution start');
      assert.equal(start.identity, identity, 'cross-artifact attempt');
      assert(Number.isSafeInteger(start.ordinal) && start.ordinal > 0);
      assert(entry.cases.some(item => item.id === start.caseId), 'unknown case ID');
      const finishFile = path.join(attemptDir, 'finish.json');
      const finish = fs.existsSync(finishFile) ? read(finishFile) : null;
      if (finish) {
        assert.equal(finish.identity, identity); assert.equal(finish.caseId, start.caseId); assert.equal(finish.ordinal, start.ordinal);
        assert(OUTCOMES.includes(finish.outcome) && finish.outcome !== 'not-run');
        assert(Date.parse(finish.finishedAt) >= Date.parse(start.startedAt), 'contradictory attempt times');
        if (finish.outcome !== 'pass') assert(finish.reason, 'missing failure/skip reason');
      }
      const phaseStarts = files(attemptDir).filter(file => /phase-\d+-start\.json$/.test(file));
      const phases = phaseStarts.map((file, index) => {
        assert.equal(path.basename(file), `phase-${String(index + 1).padStart(4, '0')}-start.json`, 'missing/duplicate phase');
        const phaseStart = read(file);
        assert.equal(phaseStart.identity, identity); assert.equal(phaseStart.caseId, start.caseId); assert.equal(phaseStart.ordinal, start.ordinal);
        const phaseFinishFile = file.replace('-start.json', '-finish.json');
        const end = fs.existsSync(phaseFinishFile) ? read(phaseFinishFile) : null;
        if (end) {
          assert.equal(end.identity, identity); assert.equal(end.caseId, start.caseId); assert.equal(end.ordinal, start.ordinal);
          assert.equal(end.phase, phaseStart.phase); assert(OUTCOMES.includes(end.outcome));
          assert(Date.parse(end.finishedAt) >= Date.parse(phaseStart.startedAt));
        }
        const prefix = file.slice(0, -'-start.json'.length);
        const logs = ['stdout', 'stderr'].map(kind => `${prefix}-${kind}.txt`).filter(fs.existsSync)
          .map(log => ({ path: relative(bundle, log), sha256: hash(fs.readFileSync(log)) }));
        return { ...phaseStart, ...end, outcome: end?.outcome || 'not-run', logs };
      });
      for (const file of files(attemptDir).filter(file => /phase-\d+-finish\.json$/.test(file))) {
        assert(fs.existsSync(file.replace('-finish.json', '-start.json')), 'phase completion without start');
      }
      if (finish) {
        assert(phases.length && phases.every(phase => phase.outcome !== 'not-run'), 'completion with unfinished phase');
        const last = phases.at(-1);
        assert(phases.slice(0, -1).every(phase => phase.outcome === 'pass'), 'continued after failed phase');
        if (finish.outcome === 'blocked') assert(['fail', 'timeout'].includes(last.outcome), 'blocked without prerequisite failure');
        else assert.equal(last.outcome, finish.outcome, 'contradictory terminal phase');
        assert.equal(last.phase === 'guest', finish.outcome !== 'blocked', 'prerequisite/guest outcome mismatch');
        assert.equal(finish.failedPhase, ['pass', 'skip'].includes(finish.outcome) ? null : last.phase, 'incorrect failed phase');
      }
      let preceding = start.startedAt;
      for (const phase of phases) {
        assert(Date.parse(phase.startedAt) >= Date.parse(preceding), 'phase precedes attempt/previous phase');
        if (phase.finishedAt) {
          if (finish) assert(Date.parse(phase.finishedAt) <= Date.parse(finish.finishedAt), 'phase after attempt completion');
          preceding = phase.finishedAt;
        }
      }
      if (finish?.outcome === 'pass') assert(phases.length && phases.every(phase => phase.outcome === 'pass') &&
        phases.some(phase => phase.phase === 'guest' && phase.logs.length === 2), 'pass without completed guest evidence');
      return { ...start, ...finish, outcome: finish?.outcome || 'not-run', reason: finish ? finish.reason : 'interrupted attempt',
        evidence: relative(bundle, startFile), phases };
    });
    // Orphan completions are invalid, not silently discarded as missing starts.
    for (const file of files(path.join(dir, 'attempts')).filter(file => path.basename(file) === 'finish.json')) {
      assert(fs.existsSync(path.join(path.dirname(file), 'start.json')), 'completion without start');
    }
    const cases = [...entry.cases].sort((a, b) => compare(a.id, b.id)).map(item => {
      const history = attempts.filter(attempt => attempt.caseId === item.id).sort((a, b) => a.ordinal - b.ordinal);
      assert(new Set(history.map(attempt => attempt.ordinal)).size === history.length, 'duplicate attempt ID');
      assert(history.every((attempt, index) => attempt.ordinal === index + 1), 'missing retry');
      assert(history.length <= item.maxAttempts, 'retry policy exceeded');
      assert(!history.slice(0, -1).some(attempt => attempt.outcome === 'pass'), 'retry after success');
      let outcome = history.at(-1)?.outcome;
      let reason = history.at(-1)?.reason || '';
      if (!outcome) {
        if (item.classification !== 'runnable') { outcome = 'skip'; reason = item.skipReason; }
        else if (prerequisites.some(item => item.outcome === 'fail')) {
          outcome = 'blocked'; reason = prerequisites.filter(item => item.outcome === 'fail').map(item => `${item.phase}: ${item.reason}`).join('; ');
        }
        else { outcome = 'not-run'; reason = 'expected case has no invocation'; }
      }
      const flaky = outcome === 'pass' && history.some(attempt => attempt.outcome !== 'pass');
      if (history.length) assert(component || outcome === 'blocked' || outcome === 'not-run', 'guest attempt without component identity');
      const coverage = entry.behaviorCases.includes(item.id) ? 'behavior' : item.coverage;
      return { ...item, coverage, key: [component?.digest || 'unbuilt', entry.consumer, entry.profile, item.id], outcome, reason, flaky,
        qualified: outcome === 'pass' && !flaky && entry.behaviorCases.includes(item.id) && sealed && !!runFinish, attempts: history };
    });
    const raw = files(dir).filter(file => path.dirname(file) === dir && /^(ctrf.*\.json|(?:harness|discovery)-(?:stdout|stderr)\.txt)$/.test(path.basename(file)))
      .map(file => ({ path: relative(bundle, file), sha256: hash(fs.readFileSync(file)) }));
    const reported = new Set();
    for (const evidence of raw.filter(file => path.basename(file.path).startsWith('ctrf'))) {
      const file = within(bundle, evidence.path);
      if (!text(file).trim()) continue; // A prerequisite failure can leave an empty runner report.
      const ctrf = read(file);
      assert(Array.isArray(ctrf.results?.tests), 'invalid raw CTRF');
      for (const result of ctrf.results.tests) {
        const item = cases.find(item => item.runnerName === result?.name);
        assert(item, 'unknown CTRF case'); assert(!reported.has(item.id), 'duplicate CTRF result'); reported.add(item.id);
        assert(['passed', 'failed', 'skipped', 'pending', 'other'].includes(result.status), 'invalid CTRF status');
        if (item.attempts.length && item.outcome !== 'not-run') {
          const expected = item.outcome === 'pass' ? ['passed'] : item.outcome === 'skip' ? ['passed', 'skipped'] : ['failed'];
          assert(expected.includes(result.status), 'CTRF contradicts captured result');
        }
      }
    }
    if (entry.profile !== 'bundled') for (const item of cases) item.qualified &&= reported.has(item.id);
    const complete = sealed && !!runFinish && prerequisites.every(item => item.outcome !== 'not-run') && cases.every(item => item.outcome !== 'not-run' &&
      item.attempts.every(attempt => attempt.outcome !== 'not-run') &&
      (entry.profile === 'bundled' || item.outcome === 'blocked' || reported.has(item.id)));
    return { ...entry, identity, selected, component, prerequisites, complete, raw, cases, totals: totals(cases) };
  });
  const selected = executions.filter(entry => entry.selected);
  const selectedKeys = new Set();
  for (const item of selected.flatMap(entry => entry.cases)) {
    const key = json(item.key);
    assert(!selectedKeys.has(key), 'overlapping selected case key');
    selectedKeys.add(key);
  }
  return { schemaVersion: 1, claim: 'Selected local assertions only; not full API support, host durability or shipped qualification.',
    complete: selected.length > 0 && selected.every(entry => entry.complete), executions,
    totals: totals(selected.flatMap(entry => entry.cases)) };
}
function render(report) {
  assert.equal(report.schemaVersion, 1); assert(Array.isArray(report.executions));
  assert.deepEqual(report.totals, totals(report.executions.filter(entry => entry.selected).flatMap(entry => entry.cases)), 'invalid report totals');
  const escape = value => String(value).replace(/[|\r\n]/g, ' ');
  const rows = ['# Measured execution report', '', report.claim,
    '', `Complete selected evidence: **${report.complete}**`, '',
    '| Execution | Profile | Selected | Cases | Non-flaky pass | Flaky pass | Properly implemented* | Attempts |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |'];
  for (const entry of report.executions) {
    assert.deepEqual(entry.totals, totals(entry.cases));
    const t = entry.totals;
    rows.push(`| ${escape(entry.id)} | ${entry.profile} | ${entry.selected} | ${t.selected} | ${t.nonFlakyPasses} | ${t.flakyPasses} | ${t.properlyImplemented}/${t.selected} (${t.properlyImplementedPercent}%) | ${t.attempts} |`);
  }
  const t = report.totals;
  rows.push('', `Selected total: ${t.selected}; non-flaky passes: ${t.nonFlakyPasses}; flaky passes: ${t.flakyPasses}; attempts: ${t.attempts}.`,
    `Outcomes: ${OUTCOMES.map(outcome => `${outcome}: ${t[outcome]}`).join('; ')}.`,
    `Properly implemented*: ${t.properlyImplemented}/${t.selected} (${t.properlyImplementedPercent}%).`, '',
    '*Only explicitly declared (reviewer-audited), non-flaky behavior cases with sealed evidence qualify in this selected local inventory. Unclassified checks and flaky passes never qualify. Reviewers must exclude import-only checks from behavior declarations; discovery does not detect their assertion quality. All selected cases remain in the denominator. This is not shipped qualification.', '');
  for (const entry of report.executions) {
    rows.push(`## ${escape(entry.id)}`, '', `Source: ${entry.source.revision}; component: ${entry.component?.digest || 'not built'}; lane: ${escape(entry.lane)}; workflow: ${escape(entry.workflowRun)}/${entry.workflowAttempt}.`, '',
      '| Case | Coverage | Qualified | Outcome | Flaky | Attempts | Reason |', '| --- | --- | --- | --- | --- | ---: | --- |');
    for (const item of entry.cases) rows.push(`| ${escape(item.id)} | ${item.coverage} | ${item.qualified} | ${item.outcome} | ${item.flaky} | ${item.attempts.length} | ${escape(item.reason)} |`);
    rows.push('');
  }
  return rows.join('\n');
}
function assemble(bundle) {
  const report = normalize(bundle);
  save(path.join(bundle, 'report.json'), report, 'w');
  fs.writeFileSync(path.join(bundle, 'report.md'), render(report));
  save(path.join(bundle, 'checksums.json'), checksums(bundle, ['checksums.json']), 'w');
  return report;
}
function verify(bundle) {
  checkDigests(bundle, read(path.join(bundle, 'checksums.json')), true, ['checksums.json']);
  assert.equal(text(path.join(bundle, 'report.json')), json(normalize(bundle)), 'normalized JSON drift');
  assert.equal(text(path.join(bundle, 'report.md')), render(read(path.join(bundle, 'report.json'))), 'Markdown drift');
}
function main(args) {
  const [operation, location, ...rest] = args; assert(location, 'missing bundle/report path');
  const bundle = path.resolve(location);
  if (operation === 'plan') {
    const [executionId, profile, filter, metadataFile] = rest;
    plan(bundle, executionId, profile, filter, metadataFile ? read(metadataFile) : {});
  } else if (operation === 'run') { if (run(bundle, rest[0]).outcome !== 'pass') process.exitCode = 1; }
  else if (operation === 'assemble') assemble(bundle);
  else if (operation === 'verify') verify(bundle);
  else if (operation === 'render') process.stdout.write(render(read(bundle)));
  else if (operation === 'select') {
    const manifest = read(path.join(bundle, 'plan.json')); validatePlan(manifest);
    assert(rest.every(value => manifest.executions.some(entry => entry.id === value)));
    assert.equal(new Set(rest).size, rest.length);
    save(path.join(bundle, 'selection.json'), rest, 'w');
  } else throw new Error('Usage: measured-report.cjs plan|run|select|assemble|verify|render <bundle/report.json> ...');
}
module.exports = { plan, run, assemble, verify, render };
if (require.main === module) { try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; } }
