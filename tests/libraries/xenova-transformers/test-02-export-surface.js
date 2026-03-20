import assert from 'assert';
import {
  AutoConfig,
  AutoTokenizer,
  env,
  pipeline,
} from '@xenova/transformers';

export const run = () => {
  assert.strictEqual(typeof env, 'object');
  assert.ok(typeof env.version === 'string' && env.version.length > 0);
  assert.strictEqual(typeof pipeline, 'function');
  assert.strictEqual(typeof AutoConfig.from_pretrained, 'function');
  assert.strictEqual(typeof AutoTokenizer.from_pretrained, 'function');

  return 'PASS: Core @xenova/transformers exports are available in the bundle';
};
