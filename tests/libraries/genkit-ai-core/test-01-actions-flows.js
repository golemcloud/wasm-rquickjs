import './genkit-setup.js';
import assert from 'assert';
import { action, flow, z } from '@genkit-ai/core';

export const run = async () => {
  const uppercaseAction = action(
    {
      actionType: 'custom',
      name: 'uppercase-action',
      inputSchema: z.string(),
      outputSchema: z.string(),
    },
    async (input) => input.toUpperCase(),
  );

  const actionResult = await uppercaseAction('genkit core');
  assert.strictEqual(actionResult, 'GENKIT CORE');

  const wordCountFlow = flow(
    {
      name: 'word-count-flow',
      inputSchema: z.string(),
      outputSchema: z.number(),
    },
    async (input) => input.trim().split(/\s+/).filter(Boolean).length,
  );

  const flowResult = await wordCountFlow('wasm rquickjs runtime');
  assert.strictEqual(flowResult, 3);

  return 'PASS: action() and flow() execute typed handlers';
};
