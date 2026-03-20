import assert from 'assert';
import weaviate from 'weaviate-client';

export const run = async () => {
  const client = await weaviate.connectToCustom({
    httpHost: 'localhost',
    httpPort: 18080,
    httpSecure: false,
    grpcHost: 'localhost',
    grpcPort: 15051,
    grpcSecure: false,
    skipInitChecks: true,
  });

  const hasBook = await client.collections.exists('Book');
  const hasMissing = await client.collections.exists('Missing');

  assert.strictEqual(hasBook, true);
  assert.strictEqual(hasMissing, false);

  await client.close();
  return 'PASS: collections.exists() works over mock HTTP schema endpoint';
};
