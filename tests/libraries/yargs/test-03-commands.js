import assert from 'assert';
import yargs from 'yargs';

export const run = () => {
  let handled = null;

  yargs(['build', 'src/index.ts', '--watch'])
    .command(
      'build <entry>',
      'build project',
      (cmd) => cmd
        .positional('entry', { type: 'string' })
        .option('watch', { type: 'boolean', default: false }),
      (argv) => {
        handled = `${argv.entry}:${argv.watch}`;
      },
    )
    .demandCommand(1)
    .exitProcess(false)
    .parseSync();

  assert.strictEqual(handled, 'src/index.ts:true');

  let strictCommandError = null;
  try {
    yargs(['deploy'])
      .command('build <entry>', 'build project')
      .strictCommands()
      .exitProcess(false)
      .parseSync();
  } catch (err) {
    strictCommandError = err;
  }

  assert.ok(strictCommandError, 'unknown command should fail in strict command mode');
  assert.match(String(strictCommandError.message), /Unknown command|Did you mean/);

  return 'PASS: command handlers and strict command validation work';
};
