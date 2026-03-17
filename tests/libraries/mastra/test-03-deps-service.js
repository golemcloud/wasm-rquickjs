import assert from 'assert';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { DepsService } from 'mastra/dist/chunk-X6S75F7L.js';

export const run = async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'mastra-deps-'));
  const previousCwd = process.cwd();

  try {
    process.chdir(tmp);

    const deps = new DepsService();
    const withoutPackageJson = await deps.checkDependencies(['mastra']);
    assert.ok(withoutPackageJson.includes('No package.json file found'));

    await fs.writeFile(
      path.join(tmp, 'package.json'),
      JSON.stringify(
        {
          name: 'deps-check-test',
          dependencies: {
            mastra: '^1.3.12',
            zod: '^4.0.0',
          },
        },
        null,
        2,
      ),
    );

    const allPresent = await deps.checkDependencies(['mastra', 'zod']);
    assert.strictEqual(allPresent, 'ok');

    const missing = await deps.checkDependencies(['@mastra/core']);
    assert.ok(missing.includes('Please install @mastra/core'));
  } finally {
    process.chdir(previousCwd);
    await fs.rm(tmp, { recursive: true, force: true });
  }

  return 'PASS: dependency checker reports missing and installed package requirements';
};
