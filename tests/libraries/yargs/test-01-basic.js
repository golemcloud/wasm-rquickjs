import assert from 'assert';
import yargs from 'yargs';

export const run = () => {
  const argv = yargs(['--name', 'alice', '-v', '-v', '--no-color'])
    .scriptName('demo')
    .option('name', { type: 'string', alias: 'n', default: 'unknown' })
    .option('verbose', { type: 'count', alias: 'v' })
    .option('color', { type: 'boolean', default: true })
    .option('mode', { type: 'string', default: 'dev' })
    .exitProcess(false)
    .parseSync();

  assert.strictEqual(argv.name, 'alice');
  assert.strictEqual(argv.n, 'alice');
  assert.strictEqual(argv.verbose, 2);
  assert.strictEqual(argv.v, 2);
  assert.strictEqual(argv.color, false);
  assert.strictEqual(argv.mode, 'dev');

  return 'PASS: basic options, aliases, and defaults parse correctly';
};
