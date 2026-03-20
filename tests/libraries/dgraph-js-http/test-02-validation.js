import assert from 'assert';
import * as dgraph from 'dgraph-js-http';

export const run = () => {
  assert.throws(() => new dgraph.DgraphClient(), (error) => error === dgraph.ERR_NO_CLIENTS);

  const stub = new dgraph.DgraphClientStub('http://localhost:18080');
  const client = new dgraph.DgraphClient(stub);

  assert.throws(
    () => client.newTxn({ bestEffort: true, readOnly: false }),
    (error) => error === dgraph.ERR_BEST_EFFORT_REQUIRED_READ_ONLY,
  );

  return 'PASS: constructor and transaction validation errors are enforced';
};
