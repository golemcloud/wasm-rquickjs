import assert from 'assert';
import { ChromaClient, ChromaValueError, CloudClient, IncludeEnum, withChroma } from 'chromadb';

export const run = () => {
  const client = new ChromaClient();
  assert.strictEqual(client.tenant, 'default_tenant');
  assert.strictEqual(client.database, 'default_database');
  assert.strictEqual(IncludeEnum.documents, 'documents');
  assert.strictEqual(typeof client.heartbeat, 'function');

  assert.throws(
    () => new CloudClient(),
    (error) => error instanceof ChromaValueError && error.message.includes('Missing API key'),
  );

  const cloud = new CloudClient({ apiKey: 'test-api-key', tenant: 'tenant-a', database: 'db-a' });
  assert.strictEqual(cloud.headers['x-chroma-token'], 'test-api-key');
  assert.strictEqual(cloud.tenant, 'tenant-a');
  assert.strictEqual(cloud.database, 'db-a');

  const wrapped = withChroma({});
  const webpackConfig = wrapped.webpack({ externals: [] }, {});
  assert.ok(webpackConfig.externals.includes('chromadb'));
  assert.ok(webpackConfig.externals.includes('@huggingface/transformers'));

  return 'PASS: client constructors and Next.js helper behave as expected';
};
