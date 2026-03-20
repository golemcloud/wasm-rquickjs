import assert from 'assert';
import yargs from 'yargs';

export const run = () => {
  const argv = yargs('--db.host localhost --db.port 5432 --foo-bar 10 -- --rest one')
    .parserConfiguration({
      'dot-notation': true,
      'camel-case-expansion': true,
      'populate--': true,
    })
    .option('foo-bar', { type: 'number' })
    .option('db.host', { type: 'string' })
    .option('db.port', { type: 'number' })
    .exitProcess(false)
    .parseSync();

  assert.strictEqual(argv.db.host, 'localhost');
  assert.strictEqual(argv.db.port, 5432);
  assert.strictEqual(argv['foo-bar'], 10);
  assert.strictEqual(argv.fooBar, 10);
  assert.deepStrictEqual(argv['--'], ['--rest', 'one']);

  return 'PASS: parserConfiguration features (dot notation, camelCase, -- capture) work';
};
