import assert from 'assert';
import { Index } from '@upstash/vector';

export const run = async () => {
  const index = new Index({
    url: 'http://localhost:18080',
    token: 'test-token',
  });

  await index.namespace('teams').upsert({ id: 'team-1', vector: [0.5, 0.5, 0.5] });

  const info = await index.info();
  const namespaces = await index.listNamespaces();
  const deleteResult = await index.deleteNamespace('teams');

  assert.ok(info.vectorCount >= 1);
  assert.ok(namespaces.includes('teams'));
  assert.strictEqual(deleteResult, 'Success');

  return 'PASS: info/listNamespaces/deleteNamespace work over HTTP';
};
