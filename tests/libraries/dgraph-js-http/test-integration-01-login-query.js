import assert from 'assert';
import * as dgraph from 'dgraph-js-http';

export const run = async () => {
  const stub = new dgraph.DgraphClientStub('http://localhost:18080');
  const client = new dgraph.DgraphClient(stub);

  const loginOk = await client.login('groot', 'password');
  assert.strictEqual(loginOk, true);

  const txn = client.newTxn({ readOnly: true });
  const response = await txn.queryWithVars(
    'query q($name: string) { q(func: eq(name, $name)) { uid name } }',
    {
      $name: 'Alice',
      $ignored: 42,
    },
  );

  assert.strictEqual(response.data.q[0].name, 'Alice');

  await txn.discard();
  return 'PASS: login and read-only query with vars work against HTTP API';
};
