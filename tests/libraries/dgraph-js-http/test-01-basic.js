import assert from 'assert';
import * as dgraph from 'dgraph-js-http';

export const run = () => {
  const stubA = new dgraph.DgraphClientStub('http://localhost:18080');
  const stubB = new dgraph.DgraphClientStub('http://localhost:18081');

  const client = new dgraph.DgraphClient(stubA, stubB);
  client.setQueryTimeout(42);

  assert.strictEqual(client.getQueryTimeout(), 42);
  assert.strictEqual(typeof client.newTxn, 'function');

  const picked = client.anyClient();
  assert.ok(picked === stubA || picked === stubB);

  stubA.setAlphaAuthToken('alpha-token');
  stubA.setCloudApiKey('cloud-key');
  stubA.setSlashApiKey('slash-key');

  assert.strictEqual(stubA.getURL('query'), 'http://localhost:18080/query');

  return 'PASS: basic client/stub configuration works';
};
