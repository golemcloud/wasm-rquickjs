import assert from 'assert';
import weaviate, { ApiKey } from 'weaviate-client';

export const run = async () => {
  const client = await weaviate.connectToCustom({
    httpHost: 'localhost',
    httpPort: 18080,
    httpSecure: false,
    grpcHost: 'localhost',
    grpcPort: 15051,
    grpcSecure: false,
    authCredentials: new ApiKey('custom-key'),
    headers: { 'X-Test-Header': 'custom' },
    skipInitChecks: true,
  });

  const details = await client.getConnectionDetails();

  assert.strictEqual(details.host, 'localhost:18080');
  assert.strictEqual(details.bearerToken, 'Bearer custom-key');
  assert.strictEqual(details.headers['X-Test-Header'], 'custom');

  await client.close();
  return 'PASS: connectToCustom builds client connection details without init checks';
};
