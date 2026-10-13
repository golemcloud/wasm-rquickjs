// Raw artifacts are immutable; only the separate presentation copies are edited.
const fs = require('node:fs/promises');
const path = require('node:path');

function latestAttempts(items) {
  const latest = new Map();
  for (const item of items) {
    const match = /^(.+)-report-attempt(\d+)$/.exec(item.name);
    if (!match) continue;
    const [, lane, digits] = match;
    const attempt = BigInt(digits);
    if (!latest.has(lane) || attempt > latest.get(lane).attempt) {
      latest.set(lane, { attempt, item });
    }
  }
  return [...latest].sort(([a], [b]) => a.localeCompare(b));
}

async function selectArtifacts({ github, context, core }) {
  // Select before downloading. Never fall back if current evidence is unavailable.
  const artifacts = await github.paginate(github.rest.actions.listWorkflowRunArtifacts, {
    ...context.repo, run_id: context.runId, per_page: 100,
  });
  const selected = latestAttempts(artifacts).map(([, { item }]) => item);
  core.setOutput('ids', selected.map(item => item.id).join(','));
  core.setOutput('single-name', selected.length === 1 ? selected[0].name : '');
}

async function prepareReports(source, destination, warning) {
  await fs.mkdir(destination, { recursive: true });
  const shards = (await fs.readdir(source, { withFileTypes: true })).filter(item => item.isDirectory());
  for (const [lane, { attempt, item }] of latestAttempts(shards)) {
    const shard = path.join(source, item.name);
    for (const name of (await fs.readdir(shard)).sort()) {
      if (!/^ctrf-.*\.json$/.test(name)) continue;
      const report = path.join(shard, name);
      let data;
      try {
        data = JSON.parse(await fs.readFile(report, 'utf8'));
        if (!Array.isArray(data?.results?.tests) ||
            !data.results.tests.every(test => test && typeof test.name === 'string')) {
          throw new Error('Invalid results.tests');
        }
      } catch (error) {
        // Aborted binaries can leave incomplete reports: retain raw evidence.
        warning(`Cannot render ${report}: ${error.message}`);
        continue;
      }
      for (const test of data.results.tests) {
        test.name = `${lane} (attempt ${attempt}) / ${test.name}`;
      }
      const output = path.join(destination, item.name);
      await fs.mkdir(output, { recursive: true });
      await fs.writeFile(path.join(output, name), JSON.stringify(data) + '\n');
    }
  }
}

module.exports = { selectArtifacts, prepareReports };
