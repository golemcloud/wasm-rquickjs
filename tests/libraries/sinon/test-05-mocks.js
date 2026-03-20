import assert from 'assert';
import sinon from 'sinon';

export const run = () => {
  const repository = {
    save(id, payload) {
      return `${id}:${payload}`;
    },
  };

  const mock = sinon.mock(repository);
  mock.expects('save').once().withExactArgs('u1', 'payload').returns('ok');

  const response = repository.save('u1', 'payload');
  assert.strictEqual(response, 'ok');

  mock.verify();

  return 'PASS: mock expectations verify exact call contracts';
};
