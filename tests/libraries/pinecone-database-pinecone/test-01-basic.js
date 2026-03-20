import assert from 'assert';
import { Pinecone } from '@pinecone-database/pinecone';

export const run = () => {
  const pc = new Pinecone({
    apiKey: 'test-api-key',
    controllerHostUrl: 'http://localhost:18080',
    sourceTag: 'lib-test',
  });

  const config = pc.getConfig();
  assert.strictEqual(config.apiKey, 'test-api-key');
  assert.strictEqual(config.controllerHostUrl, 'http://localhost:18080');

  const index = pc.index({ host: 'http://localhost:18080', namespace: 'tenant-a' });
  const namespaced = index.namespace('tenant-b');

  assert.ok(index);
  assert.ok(namespaced);

  return 'PASS: Pinecone client configuration and index namespace helpers work';
};
