const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { selectArtifacts, prepareReports } = require('./prepare-test-reports.cjs');

test('mixed-attempt reruns select latest per lane and never mutate source evidence', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ci-reports-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'raw');
  const destination = path.join(root, 'rendered');
  const artifacts = [];
  const evidence = new Map();
  for (const [lane, attempt, status] of [
    ['p2', 1, 'failed'], ['p2', 2, 'failed'], ['p2', 10, 'passed'], ['p3', 1, 'passed'],
  ]) {
    const name = `${lane}-report-attempt${attempt}`;
    artifacts.push({ name, id: artifacts.length + 1 });
    const shard = path.join(source, name);
    await fs.mkdir(path.join(shard, 'ci-retries/original'), { recursive: true });
    for (const [file, bytes] of [
      ['ctrf-test.json', JSON.stringify({ results: { tests: [{ name: 'runtime::same', status,
        extra: { testR: { attempts: [{ status: 'failed', stdout: ['raw history'] }] } } }] } })],
      ['ctrf-aborted.json', '{'],
      ['ctrf-invalid.json', '{"results":{"tests":[null]}}'],
      ['ci-retries/original/ctrf-original.json', 'not a final result'],
    ]) {
      const report = path.join(shard, file);
      await fs.writeFile(report, bytes);
      evidence.set(report, bytes);
    }
  }
  const endpoint = () => {};
  async function select(pages) {
    const outputs = {};
    await selectArtifacts({
      github: { rest: { actions: { listWorkflowRunArtifacts: endpoint } },
        paginate: async (method, args) => {
          assert.equal(method, endpoint);
          assert.deepEqual(args, { owner: 'owner', repo: 'repo', run_id: 42, per_page: 100 });
          return pages.flatMap(page => page.artifacts);
        } },
      context: { repo: { owner: 'owner', repo: 'repo' }, runId: 42 },
      core: { setOutput: (name, value) => { outputs[name] = value; } },
    });
    return outputs;
  }
  assert.deepEqual(await select([
    { artifacts: artifacts.slice(0, 2) },
    { artifacts: [...artifacts.slice(2), { name: 'ci-test-reports-attempt99', id: 99 }] },
  ]), { ids: '3,4', 'single-name': '' });
  assert.deepEqual(await select([{ artifacts: artifacts.slice(-1) }]),
    { ids: '4', 'single-name': 'p3-report-attempt1' });
  assert.deepEqual(await select([{ artifacts: [] }]), { ids: '', 'single-name': '' });

  const warnings = [];
  await prepareReports(source, destination, message => warnings.push(message));
  assert.equal(warnings.length, 4);
  assert.deepEqual(await fs.readdir(destination), ['p2-report-attempt10', 'p3-report-attempt1']);
  for (const [lane, attempt] of [['p2', 10], ['p3', 1]]) {
    const shard = path.join(destination, `${lane}-report-attempt${attempt}`);
    assert.deepEqual(await fs.readdir(shard), ['ctrf-test.json']);
    const data = JSON.parse(await fs.readFile(path.join(shard, 'ctrf-test.json'), 'utf8'));
    assert.equal(data.results.tests[0].name, `${lane} (attempt ${attempt}) / runtime::same`);
    assert.equal(data.results.tests[0].status, 'passed');
    assert.deepEqual(data.results.tests[0].extra.testR.attempts, [{ status: 'failed', stdout: ['raw history'] }]);
  }
  for (const [report, bytes] of evidence) assert.equal(await fs.readFile(report, 'utf8'), bytes);
});
