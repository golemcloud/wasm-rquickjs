import assert from 'assert';
import convict from 'convict';

export const run = () => {
  const config = convict(
    {
      limits: {
        maxItems: { format: 'nat', default: 10 },
      },
      tags: {
        format: Array,
        default: ['stable'],
      },
    },
    { env: {}, args: [] },
  );

  config.set('limits.maxItems', 25);
  assert.strictEqual(config.get('limits.maxItems'), 25);
  assert.strictEqual(config.default('limits.maxItems'), 10);

  config.reset('limits.maxItems');
  assert.strictEqual(config.get('limits.maxItems'), 10);

  const props = config.getProperties();
  props.tags.push('mutated');
  assert.deepStrictEqual(config.get('tags'), ['stable']);

  config.validate({ allowed: 'strict' });

  return 'PASS: reset, default, and property cloning behave correctly';
};
