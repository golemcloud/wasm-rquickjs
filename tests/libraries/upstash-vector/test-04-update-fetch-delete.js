import assert from 'assert';
import { Index } from '@upstash/vector';

export const run = async () => {
  const requester = {
    request: async (req) => {
      if (`${req.path}`.includes('update')) {
        return { result: { updated: 1 } };
      }
      if (`${req.path}`.includes('fetch')) {
        return {
          result: [{ id: 'doc-1', vector: [0.1, 0.2, 0.3], metadata: { kind: 'test' } }],
        };
      }
      if (`${req.path}`.includes('delete')) {
        return { result: { deleted: 1 } };
      }
      throw new Error(`Unexpected endpoint: ${req.path}`);
    },
  };

  const index = new Index(requester);

  const updated = await index.update({ id: 'doc-1', metadata: { kind: 'updated' } });
  const fetched = await index.fetch(['doc-1']);
  const deleted = await index.delete('doc-1');

  assert.strictEqual(updated.updated, 1);
  assert.strictEqual(fetched.length, 1);
  assert.strictEqual(fetched[0].id, 'doc-1');
  assert.strictEqual(deleted.deleted, 1);

  return 'PASS: update/fetch/delete command helpers process API results';
};
