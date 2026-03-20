import assert from 'assert';
import yargs from 'yargs';

export const run = () => {
  const argv = yargs(['--tag', 'alpha', '--tag', 'beta', '--pair', 'left', 'right'])
    .option('tag', { type: 'array' })
    .option('pair', { type: 'array', nargs: 2 })
    .coerce('tag', (values) => values.map((v) => String(v).toUpperCase()))
    .middleware((parsed) => {
      parsed.tagCount = parsed.tag.length;
    })
    .exitProcess(false)
    .parseSync();

  assert.deepStrictEqual(argv.tag, ['ALPHA', 'BETA']);
  assert.deepStrictEqual(argv.pair, ['left', 'right']);
  assert.strictEqual(argv.tagCount, 2);

  let requiresArgError = null;
  try {
    yargs(['--name'])
      .option('name', { type: 'string' })
      .requiresArg('name')
      .exitProcess(false)
      .parseSync();
  } catch (err) {
    requiresArgError = err;
  }

  assert.ok(requiresArgError, 'requiresArg should fail when value is missing');
  assert.match(String(requiresArgError.message), /Not enough arguments|Missing argument value/);

  return 'PASS: middleware, coerce, nargs, and requiresArg behave correctly';
};
