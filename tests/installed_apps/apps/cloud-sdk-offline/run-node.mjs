import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const testPath = process.argv[2];
if (!testPath) {
  console.error('Usage: node run-node.mjs <test-file>');
  process.exit(1);
}

const mod = testPath.endsWith('.cjs')
  ? createRequire(import.meta.url)(`./${testPath}`)
  : await import(pathToFileURL(new URL(testPath, import.meta.url).pathname).href);

const run = mod.run || mod.default?.run;
if (typeof run !== 'function') throw new Error(`${testPath} does not export run()`);

const result = await run();
console.log(result);
if (typeof result !== 'string' || !result.startsWith('PASS:')) process.exit(1);
