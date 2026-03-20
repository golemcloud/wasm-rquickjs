import assert from 'assert';
import { __internal_sha256 } from '@huggingface/hub';

async function hashText(input) {
  const generator = __internal_sha256(new Blob([input]));

  while (true) {
    const step = await generator.next();
    if (step.done) {
      return step.value;
    }
  }
}

export const run = async () => {
  const helloHash = await hashText('hello world');
  assert.strictEqual(
    helloHash,
    'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
  );

  const emptyHash = await hashText('');
  assert.strictEqual(
    emptyHash,
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );

  return 'PASS: __internal_sha256 returns deterministic hashes';
};
