import assert from 'assert';
import weaviate from 'weaviate-client';

export const run = async () => {
  const client = await weaviate.connectToWeaviateCloud('https://demo.weaviate.network', {
    authCredentials: 'cloud-api-key',
    headers: { 'X-Test-Header': 'cloud' },
    skipInitChecks: true,
  });

  const details = await client.getConnectionDetails();

  assert.strictEqual(details.host, 'demo.weaviate.network');
  assert.strictEqual(details.bearerToken, 'Bearer cloud-api-key');
  assert.strictEqual(details.headers['X-Test-Header'], 'cloud');

  await client.close();
  return 'PASS: connectToWeaviateCloud resolves host and auth headers correctly';
};
