import assert from 'assert';
import { toFile } from 'openai';

export const run = async () => {
  const file = await toFile(Uint8Array.from([104, 105]), 'greeting.txt', {
    type: 'text/plain',
  });

  assert.strictEqual(file.name, 'greeting.txt');
  assert.strictEqual(file.size, 2);
  assert.strictEqual(file.type, 'text/plain');

  const text = await file.text();
  assert.strictEqual(text, 'hi');

  return 'PASS: toFile helper builds a File from bytes with metadata';
};
