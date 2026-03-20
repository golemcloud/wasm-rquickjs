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

  const collection = client.collections.get('Book');
  const id = '00000000-0000-0000-0000-000000000201';

  const inserted = await collection.data.insert({
    id,
    properties: {
      title: 'The Left Hand of Darkness',
    },
  });

  const existsInserted = await collection.data.exists(id);
  const existsMissing = await collection.data.exists('00000000-0000-0000-0000-000000009999');

  assert.strictEqual(inserted, id);
  assert.strictEqual(existsInserted, true);
  assert.strictEqual(existsMissing, false);

  await client.close();
  return 'PASS: data.insert() and data.exists() work over mock HTTP endpoints';
};
