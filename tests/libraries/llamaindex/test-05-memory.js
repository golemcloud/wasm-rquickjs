import assert from 'node:assert';
import { createMemory, staticBlock } from 'llamaindex';

export const run = async () => {
  const memory = createMemory({
    memoryBlocks: [
      staticBlock({
        content: 'You are a concise assistant.',
        messageRole: 'system',
      }),
    ],
  });

  await memory.add({ role: 'user', content: 'Hello' });
  await memory.add({ role: 'assistant', content: 'Hi there' });

  const plain = await memory.get();
  assert.strictEqual(plain.length, 2);
  assert.strictEqual(plain[0].role, 'user');

  const llmMessages = await memory.getLLM();
  assert.strictEqual(llmMessages[0].role, 'system');
  assert.strictEqual(llmMessages[0].content, 'You are a concise assistant.');

  await memory.clear();
  const afterClear = await memory.get();
  assert.strictEqual(afterClear.length, 0);

  return 'PASS: createMemory stores, decorates, and clears chat state';
};
