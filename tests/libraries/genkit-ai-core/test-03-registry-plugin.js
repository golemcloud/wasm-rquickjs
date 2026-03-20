import './genkit-setup.js';
import assert from 'assert';
import { defineAction, z } from '@genkit-ai/core';
import { Registry } from '@genkit-ai/core/registry';

export const run = async () => {
  const registry = new Registry();

  registry.registerPluginProvider('local-test-plugin', {
    name: 'local-test-plugin',
    initializer: async () => {
      defineAction(
        registry,
        {
          actionType: 'custom',
          name: 'local-test-plugin/echo',
          inputSchema: z.string(),
          outputSchema: z.string(),
        },
        async (input) => `echo:${input}`,
      );
      return {};
    },
  });

  await registry.initializePlugin('local-test-plugin');

  const echoAction = await registry.lookupAction('/custom/local-test-plugin/echo');
  assert.ok(echoAction, 'Expected action to be registered by plugin initializer');

  const result = await echoAction('ok');
  assert.strictEqual(result, 'echo:ok');

  registry.registerValue('defaultModel', 'mock-model', { id: 'model-1' });
  const value = await registry.lookupValue('defaultModel', 'mock-model');
  assert.deepStrictEqual(value, { id: 'model-1' });

  return 'PASS: Registry plugin initialization, action lookup, and value lookup work';
};
