import assert from 'assert';
import neo4j from 'neo4j-driver';

export const run = () => {
  const basic = neo4j.auth.basic('alice', 'secret', 'users');
  assert.strictEqual(basic.scheme, 'basic');
  assert.strictEqual(basic.principal, 'alice');
  assert.strictEqual(basic.credentials, 'secret');
  assert.strictEqual(basic.realm, 'users');

  const custom = neo4j.auth.custom('bob', 'cred', 'realm', 'custom-scheme', { tenant: 't1' });
  assert.strictEqual(custom.scheme, 'custom-scheme');
  assert.strictEqual(custom.parameters.tenant, 't1');

  const num = neo4j.int('42');
  assert.ok(neo4j.isInt(num));
  assert.strictEqual(num.toNumber(), 42);
  assert.strictEqual(neo4j.integer.inSafeRange(num), true);

  return 'PASS: auth token builders and Integer helpers work as expected';
};
