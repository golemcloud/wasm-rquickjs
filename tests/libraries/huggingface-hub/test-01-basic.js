import assert from 'assert';
import { HUB_URL, getRepoFolderName, parseRepoType } from '@huggingface/hub';

export const run = () => {
  assert.strictEqual(HUB_URL, 'https://huggingface.co');

  assert.strictEqual(parseRepoType('models'), 'model');
  assert.strictEqual(parseRepoType('datasets'), 'dataset');
  assert.strictEqual(parseRepoType('spaces'), 'space');

  assert.strictEqual(
    getRepoFolderName({ type: 'model', name: 'gpt2' }),
    'models--gpt2',
  );
  assert.strictEqual(
    getRepoFolderName({ type: 'dataset', name: 'owner/my-dataset' }),
    'datasets--owner--my-dataset',
  );

  return 'PASS: constants and repo helpers work correctly';
};
