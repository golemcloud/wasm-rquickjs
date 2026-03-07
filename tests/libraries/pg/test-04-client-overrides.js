import assert from 'assert';
import pg from 'pg';

const { Client, types } = pg;

export const run = () => {
  const oidInt8 = 20;
  const globalParserBefore = types.getTypeParser(oidInt8, 'text');

  const client = new Client();
  client.setTypeParser(oidInt8, 'text', (value) => `bigint:${value}`);

  const clientParser = client.getTypeParser(oidInt8, 'text');
  assert.strictEqual(clientParser('9001'), 'bigint:9001');

  const globalParserAfter = types.getTypeParser(oidInt8, 'text');
  assert.strictEqual(globalParserAfter('9001'), globalParserBefore('9001'));

  return 'PASS: client-specific parser overrides do not mutate global parser state';
};
