import assert from 'assert';
import {
  globMatch,
  isQuantizedTensor,
  parseSafetensorsShardFilename,
} from '@huggingface/hub';

export const run = () => {
  const parsed = parseSafetensorsShardFilename('model-00001-of-000163.safetensors');
  assert.deepStrictEqual(parsed, {
    prefix: 'model-',
    basePrefix: 'model',
    shard: '00001',
    total: '000163',
  });

  assert.strictEqual(parseSafetensorsShardFilename('model.safetensors'), null);

  assert.strictEqual(globMatch('*.weight', 'model.weight'), true);
  assert.strictEqual(globMatch('*.weight', 'model.bias'), false);
  assert.strictEqual(globMatch('encoder.*', 'encoder.layers.0'), true);

  assert.strictEqual(
    isQuantizedTensor('model.layers.0.self_attn.q_proj.weight', {
      quant_method: 'gptq',
      bits: 4,
      modules_to_not_convert: ['lm_head'],
    }),
    true,
  );
  assert.strictEqual(
    isQuantizedTensor('model.lm_head.weight', {
      quant_method: 'gptq',
      bits: 4,
      modules_to_not_convert: ['lm_head'],
    }),
    false,
  );

  return 'PASS: safetensors utility functions behave as expected';
};
