import assert from 'assert';
import Strategy from 'passport-local';

export const run = () => {
  const strategyDoneError = new Strategy((_username, _password, done) => {
    done(new Error('db unavailable'));
  });

  let capturedDoneError;
  strategyDoneError.success = () => {
    throw new Error('strategy.success should not be called when done(err) is used');
  };
  strategyDoneError.fail = () => {
    throw new Error('strategy.fail should not be called when done(err) is used');
  };
  strategyDoneError.error = (error) => {
    capturedDoneError = error;
  };

  strategyDoneError.authenticate({ body: { username: 'carol', password: 'secret' } });
  assert.ok(capturedDoneError instanceof Error);
  assert.strictEqual(capturedDoneError.message, 'db unavailable');

  const strategyThrownError = new Strategy(() => {
    throw new TypeError('sync failure');
  });

  let capturedThrownError;
  strategyThrownError.success = () => {
    throw new Error('strategy.success should not be called when verify throws');
  };
  strategyThrownError.fail = () => {
    throw new Error('strategy.fail should not be called when verify throws');
  };
  strategyThrownError.error = (error) => {
    capturedThrownError = error;
  };

  strategyThrownError.authenticate({ body: { username: 'dave', password: 'secret' } });
  assert.ok(capturedThrownError instanceof TypeError);
  assert.strictEqual(capturedThrownError.message, 'sync failure');

  return 'PASS: done(err) and thrown verify exceptions route to error()';
};
