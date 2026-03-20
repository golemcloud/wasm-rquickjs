import assert from 'assert';
import yargs from 'yargs';

export const run = () => {
  const ok = yargs(['--mode', 'prod', '--port', '8080'])
    .option('mode', { choices: ['dev', 'prod'] })
    .option('port', { type: 'number' })
    .demandOption('mode')
    .check((argv) => {
      if (argv.port <= 0) {
        throw new Error('port must be > 0');
      }
      return true;
    })
    .exitProcess(false)
    .parseSync();

  assert.strictEqual(ok.mode, 'prod');
  assert.strictEqual(ok.port, 8080);

  let choicesError = null;
  try {
    yargs(['--mode', 'qa'])
      .option('mode', { choices: ['dev', 'prod'] })
      .exitProcess(false)
      .parseSync();
  } catch (err) {
    choicesError = err;
  }
  assert.ok(choicesError, 'invalid choices should throw');
  assert.match(String(choicesError.message), /Invalid values|mode/);

  let impliesError = null;
  try {
    yargs(['--tls'])
      .option('tls', { type: 'boolean' })
      .option('cert', { type: 'string' })
      .implies('tls', 'cert')
      .exitProcess(false)
      .parseSync();
  } catch (err) {
    impliesError = err;
  }
  assert.ok(impliesError, 'implies should enforce dependencies');
  assert.match(String(impliesError.message), /Implications failed|cert/);

  return 'PASS: validation, choices, and implies rules behave as expected';
};
