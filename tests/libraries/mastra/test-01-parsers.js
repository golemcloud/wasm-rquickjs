import assert from 'assert';
import {
  parseComponents,
  parseLlmProvider,
  parseMcp,
  parseSkills,
  shouldSkipDotenvLoading,
  getPackageManagerAddCommand,
} from 'mastra/dist/chunk-X6S75F7L.js';

export const run = () => {
  assert.deepStrictEqual(parseSkills('agents, tools, workflows'), ['agents', 'tools', 'workflows']);
  assert.deepStrictEqual(parseComponents('agents,tools'), ['agents', 'tools']);
  assert.strictEqual(parseMcp('vscode'), 'vscode');
  assert.strictEqual(parseLlmProvider('openai'), 'openai');

  assert.throws(() => parseComponents('agents,invalid-component'), /Choose valid components/);
  assert.throws(() => parseMcp('not-an-editor'), /Choose a valid value/);
  assert.throws(() => parseLlmProvider('not-a-provider'), /Choose a valid provider/);

  const original = process.env.MASTRA_SKIP_DOTENV;
  process.env.MASTRA_SKIP_DOTENV = '1';
  assert.strictEqual(shouldSkipDotenvLoading(), true);
  process.env.MASTRA_SKIP_DOTENV = 'true';
  assert.strictEqual(shouldSkipDotenvLoading(), true);
  process.env.MASTRA_SKIP_DOTENV = '0';
  assert.strictEqual(shouldSkipDotenvLoading(), false);
  if (original === undefined) {
    delete process.env.MASTRA_SKIP_DOTENV;
  } else {
    process.env.MASTRA_SKIP_DOTENV = original;
  }

  assert.strictEqual(getPackageManagerAddCommand('npm').includes('install'), true);
  assert.strictEqual(getPackageManagerAddCommand('pnpm').startsWith('add'), true);

  return 'PASS: parser and CLI utility helpers validate and normalize inputs';
};
