import assert from 'assert';
import * as dgraph from 'dgraph-js-http';

export const run = async () => {
  const stub = new dgraph.DgraphClientStub('http://localhost:18080');

  await assert.rejects(
    () => stub.login(),
    (error) =>
      error instanceof Error &&
      error.message ===
        'Cannot find login details: neither userid/password nor refresh token are specified',
  );

  const tokens = stub.getAuthTokens();
  assert.strictEqual(tokens.accessToken, undefined);
  assert.strictEqual(tokens.refreshToken, undefined);

  return 'PASS: login validation fails fast without credentials';
};
