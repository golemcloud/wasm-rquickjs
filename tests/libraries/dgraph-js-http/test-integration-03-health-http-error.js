import assert from 'assert';
import * as dgraph from 'dgraph-js-http';

export const run = async () => {
  const stub = new dgraph.DgraphClientStub('http://localhost:18080');

  const healthText = await stub.getHealth();
  assert.strictEqual(healthText, 'healthy');

  await assert.rejects(
    () => stub.getState(),
    (error) => error instanceof dgraph.HTTPError && error.errorResponse.status === 503,
  );

  return 'PASS: health raw text and HTTPError propagation work as expected';
};
