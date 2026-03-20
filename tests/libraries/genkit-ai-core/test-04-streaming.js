import './genkit-setup.js';
import assert from 'assert';
import { action, z } from '@genkit-ai/core';

export const run = async () => {
  const streamAction = action(
    {
      actionType: 'custom',
      name: 'stream-sum',
      inputSchema: z.array(z.number()),
      outputSchema: z.number(),
      streamSchema: z.number(),
    },
    async (input, { sendChunk }) => {
      let sum = 0;
      for (const value of input) {
        sum += value;
        sendChunk(sum);
      }
      return sum;
    },
  );

  const { stream, output } = streamAction.stream([1, 2, 3, 4]);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  const final = await output;
  assert.deepStrictEqual(chunks, [1, 3, 6, 10]);
  assert.strictEqual(final, 10);

  return 'PASS: stream() emits chunks and returns final output';
};
