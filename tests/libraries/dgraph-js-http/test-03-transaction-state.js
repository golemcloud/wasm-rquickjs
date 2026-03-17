import assert from 'assert';
import * as dgraph from 'dgraph-js-http';

export const run = async () => {
  const stub = new dgraph.DgraphClientStub('http://localhost:18080');
  const client = new dgraph.DgraphClient(stub);

  const txn1 = client.newTxn({ readOnly: true });
  await txn1.discard();

  await assert.rejects(
    () => txn1.query('{ q(func: has(name)) { uid } }'),
    (error) => error === dgraph.ERR_FINISHED,
  );

  const txn2 = client.newTxn();
  await txn2.commit();

  await assert.rejects(
    () => txn2.commit(),
    (error) => error === dgraph.ERR_FINISHED,
  );

  return 'PASS: transaction finished state blocks further operations';
};
