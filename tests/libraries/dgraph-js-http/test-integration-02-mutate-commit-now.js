import assert from 'assert';
import * as dgraph from 'dgraph-js-http';

export const run = async () => {
  const stub = new dgraph.DgraphClientStub('http://localhost:18080');
  const client = new dgraph.DgraphClient(stub);

  const txn = client.newTxn();
  const response = await txn.mutate({
    setJson: { uid: '_:alice', name: 'Alice' },
    commitNow: true,
  });

  assert.strictEqual(response.data.code, 'Success');

  await assert.rejects(
    () => txn.query('{ q(func: has(name)) { uid } }'),
    (error) => error === dgraph.ERR_FINISHED,
  );

  return 'PASS: JSON mutation sends commitNow and closes transaction';
};
