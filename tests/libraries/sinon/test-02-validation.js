import assert from 'assert';
import sinon from 'sinon';

export const run = () => {
  const service = {
    findUser(id) {
      return `user-${id}`;
    },
  };

  const stub = sinon.stub(service, 'findUser');
  stub.withArgs(1).returns('alice');
  stub.withArgs(2).throws(new Error('not found'));

  assert.strictEqual(service.findUser(1), 'alice');
  assert.throws(() => service.findUser(2), /not found/);
  assert.strictEqual(service.findUser(3), undefined);
  assert.strictEqual(stub.callCount, 3);

  stub.restore();
  assert.strictEqual(service.findUser(4), 'user-4');

  return 'PASS: stub behavior with withArgs and restore works';
};
