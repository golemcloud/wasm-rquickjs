import assert from 'assert';
import { RequestContext, TransactionContext } from '@mikro-orm/core';

export const run = () => {
  const defaultEm = {
    name: 'default',
    _id: 'root-em',
    fork: () => ({
      name: 'default',
      _id: 'forked-em',
      fork: () => {
        throw new Error('Unexpected nested fork in test');
      },
    }),
  };

  RequestContext.create(defaultEm, () => {
    const emFromContext = RequestContext.getEntityManager();
    assert.ok(emFromContext);
    assert.strictEqual(emFromContext._id, 'forked-em');
  });

  const txEm = { name: 'default', _id: 'tx-em' };
  TransactionContext.create(txEm, () => {
    const emFromTx = TransactionContext.getEntityManager();
    assert.ok(emFromTx);
    assert.strictEqual(emFromTx._id, 'tx-em');
  });

  return 'PASS: RequestContext and TransactionContext preserve entity managers';
};
