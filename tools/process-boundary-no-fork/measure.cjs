const { spawnSync } = require('node:child_process');
const { writeFileSync, appendFileSync, statSync } = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const results = process.argv[2];
const repetitions = Number(process.env.BOUNDARY_REPETITIONS || 11);
const multiplier = Number(process.env.BOUNDARY_SIZE_MULTIPLIER || 1);
assert.ok(Number.isInteger(repetitions) && repetitions >= 6);
assert.ok(Number.isInteger(multiplier) && multiplier >= 1);
const host = path.resolve('tools/process-boundary-no-fork/target/release/process-boundary-no-fork');
const fixturesResult = spawnSync(host, ['fixtures'], { encoding: 'utf8', timeout: 10000 });
assert.equal(fixturesResult.status, 0, fixturesResult.stderr);
const fixtures = JSON.parse(fixturesResult.stdout);
function invoke(lane, expression) {
  const args = ['run', '--allow-precompiled'];
  if (lane === 'p3') args.push('-S', 'p3=y', '-W', 'component-model-async=y');
  args.push('--invoke', expression, path.join(results, `prototype-${lane}.cwasm`));
  const result = spawnSync('wasmtime', args, { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.error, undefined, `${lane} ${expression}`);
  assert.equal(result.status, 0, `${lane} ${expression}\n${result.stderr}`);
  return JSON.parse(JSON.parse(result.stdout.trim()));
}
for (const lane of ['p2', 'p3']) writeFileSync(path.join(results, `${lane}-correctness.jsonl`), '');
for (const lane of ['p2', 'p3']) writeFileSync(path.join(results, `${lane}-completion.jsonl`), '');
// Interleave lanes, with a new Wasmtime process/store/instance for every call.
for (let repetition = 0; repetition < 5; repetition++) {
  for (let caseId = 0; caseId < fixtures.length; caseId++) {
    for (const lane of repetition % 2 ? ['p3', 'p2'] : ['p2', 'p3']) {
      const record = invoke(lane, `run(${caseId}, true)`);
      assert.equal(record.name, fixtures[caseId].name);
      assert.equal(record.failure, null);
      assert.equal(record.mutations, 0);
      assert.equal(record.weak_runtime_released, true);
      appendFileSync(path.join(results, `${lane}-correctness.jsonl`), JSON.stringify({ repetition, ...record })+'\n');
    }
  }
  for (const lane of ['p2', 'p3']) {
    for (const caseId of [9, 19, 20]) {
      const record = invoke(lane, `run(${caseId}, false)`);
      assert.equal(caseId === 9 ? record.mutations : record.conversions, 1, 'negative control must expose the bypass');
      assert.equal(record.weak_runtime_released, true);
      appendFileSync(path.join(results, `${lane}-correctness.jsonl`), JSON.stringify({ repetition, ...record })+'\n');
    }
  }
  for (let caseId = 0; caseId < 7; caseId++) {
    for (const lane of repetition % 2 ? ['p3', 'p2'] : ['p2', 'p3']) {
      const record = invoke(lane, `complete(${caseId})`);
      assert.equal(record.case, caseId);
      assert.equal(record.weak_runtime_released, true);
      assert.equal(record.phase, caseId === 3 ? 'Failed' : caseId === 4 ? 'Cancelled' : 'Complete');
      assert.equal(record.channels_finished, caseId === 3 ? 1 : caseId === 4 ? 0 : 2);
      appendFileSync(path.join(results, `${lane}-completion.jsonl`), JSON.stringify({ repetition, ...record })+'\n');
    }
  }
  console.log(`P2/P3 correctness repetition ${repetition + 1}/5 passed`);
}
const records = [];
for (const lane of ['host', 'p2', 'p3']) writeFileSync(path.join(results, `${lane}-bench.jsonl`), '');
// Native samples are collected in the same run, without concurrent benchmarks.
const native = spawnSync(host, ['bench', String(repetitions), String(multiplier)], { encoding: 'utf8', timeout: 120000 });
assert.equal(native.error, undefined);
assert.equal(native.status, 0, native.stderr);
const nativeRecords = native.stdout.trim().split('\n').map(JSON.parse);
assert.equal(nativeRecords.length, repetitions * 12);
for (let index = 0; index < nativeRecords.length; index++) {
  const record = { lane: 'host', repetition: Math.floor(index / 12), ...nativeRecords[index] };
  records.push(record);
  appendFileSync(path.join(results, 'host-bench.jsonl'), JSON.stringify(record)+'\n');
}
for (let repetition = 0; repetition < repetitions; repetition++) {
  for (let workload = 0; workload < 4; workload++) {
    const size = [2000000, 20000, 4000, 4000][workload] * (workload === 0 ? 1 : multiplier);
    for (let order = 0; order < 3; order++) {
      const mode = (order + repetition) % 3;
      for (const lane of repetition % 2 ? ['p3', 'p2'] : ['p2', 'p3']) {
        const record = { lane, repetition, ...invoke(lane, `benchmark(${workload}, ${mode}, ${size})`) };
        records.push(record);
        appendFileSync(path.join(results, `${lane}-bench.jsonl`), JSON.stringify(record)+'\n');
      }
    }
  }
  console.log(`P2/P3 benchmark repetition ${repetition + 1}/${repetitions} collected`);
}
function median(values) {
  values = [...values].sort((a,b)=>a-b);
  return (values[Math.floor(values.length/2)] + values[Math.floor((values.length-1)/2)])/2;
}
const summary = [];
for (const lane of ['host', 'p2', 'p3']) {
  for (let workload = 0; workload < 4; workload++) {
    const selected = records.filter(r => r.lane === lane && r.workload === workload && r.repetition > 0);
    const variants = Array.from({ length: 3 }, (_, variant) => {
      const samples = selected.filter(r => r.variant === variant);
      const values = samples.map(r => r.execution_us);
      return { variant, median_us: median(values), min_us: Math.min(...values), max_us: Math.max(...values),
        initialization_us: median(samples.map(r=>r.initialization_us)), total_us: median(samples.map(r=>r.total_us)) };
    });
    const paired = [];
    for (let repetition = 1; repetition < repetitions; repetition++) {
      const samples = selected.filter(r=>r.repetition === repetition);
      paired.push(samples.find(r=>r.variant===2).execution_us / samples.find(r=>r.variant===0).execution_us);
    }
    summary.push({ lane, workload, samples_per_variant: repetitions - 1, variants,
      guarded_stock_median_ratio: variants[2].median_us / variants[0].median_us,
      paired_median_ratio: median(paired), paired_min_ratio: Math.min(...paired), paired_max_ratio: Math.max(...paired) });
  }
}
const output = { repetitions, multiplier, discarded_warmup_repetitions: 1, summary,
  wasm_bytes: Object.fromEntries(['p2','p3'].map(lane=>[lane, statSync(path.join(results,`prototype-${lane}.wasm`)).size])) };
writeFileSync(path.join(results, 'summary.json'), JSON.stringify(output, null, 2)+'\n');
console.log(JSON.stringify(output, null, 2));
