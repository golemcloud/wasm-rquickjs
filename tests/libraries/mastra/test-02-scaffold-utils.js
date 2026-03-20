import assert from 'assert';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import {
  createComponentsDir,
  createMastraDir,
  getAPIKey,
  getModelIdentifier,
  writeCodeSample,
  writeIndexFile,
} from 'mastra/dist/chunk-X6S75F7L.js';

export const run = async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'mastra-scaffold-'));
  const previousCwd = process.cwd();

  try {
    process.chdir(tmp);

    const result = await createMastraDir('src');
    assert.strictEqual(result.ok, true);
    assert.ok(result.dirPath.endsWith(path.join('src', 'mastra')));

    await createComponentsDir(result.dirPath, 'agents');
    await createComponentsDir(result.dirPath, 'tools');
    await writeCodeSample(result.dirPath, 'agents', 'openai', ['tools']);
    await writeCodeSample(result.dirPath, 'tools', 'openai', []);

    await writeIndexFile({
      dirPath: result.dirPath,
      addAgent: true,
      addExample: false,
      addWorkflow: false,
      addScorers: false,
    });

    const indexFile = await fs.readFile(path.join(result.dirPath, 'index.ts'), 'utf8');
    const agentFile = await fs.readFile(path.join(result.dirPath, 'agents', 'weather-agent.ts'), 'utf8');

    assert.ok(indexFile.includes('new Mastra()'));
    assert.ok(agentFile.includes('Weather Agent'));

    assert.strictEqual(getModelIdentifier('openai'), 'openai/gpt-5-mini');
    assert.strictEqual(getModelIdentifier('anthropic'), 'anthropic/claude-sonnet-4-5');
    assert.strictEqual(await getAPIKey('google'), 'GOOGLE_GENERATIVE_AI_API_KEY');
  } finally {
    process.chdir(previousCwd);
    await fs.rm(tmp, { recursive: true, force: true });
  }

  return 'PASS: scaffolding utilities create mastra starter files and provider defaults';
};
