import assert from 'assert';
import weaviate from 'weaviate-client';

export const run = async () => {
  const client = await weaviate.connectToLocal({
    host: 'localhost',
    port: 18090,
    grpcPort: 15051,
    skipInitChecks: true,
  });

  const collectionName = 'LibCompatBook';

  if (await client.collections.exists(collectionName)) {
    await client.collections.delete(collectionName);
  }

  await client.collections.create({
    name: collectionName,
    properties: [{ name: 'title', dataType: weaviate.configure.dataType.TEXT }],
    vectorizers: weaviate.configure.vectorizer.none(),
  });

  const collection = client.collections.get(collectionName);
  const id = '00000000-0000-0000-0000-000000000301';

  const inserted = await collection.data.insert({
    id,
    properties: { title: 'Neuromancer' },
  });

  const existsAfterInsert = await collection.data.exists(id);

  await client.collections.delete(collectionName);
  const existsAfterDelete = await client.collections.exists(collectionName);

  assert.strictEqual(inserted, id);
  assert.strictEqual(existsAfterInsert, true);
  assert.strictEqual(existsAfterDelete, false);

  await client.close();
  return 'PASS: create/insert/delete cycle works against Docker Weaviate';
};
