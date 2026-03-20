import assert from 'assert';
import Strategy from 'passport-local';

export const run = () => {
  const strategyFail = new Strategy((_username, _password, done) => {
    done(null, false, { message: 'Bad credentials' });
  });

  let failInfo;
  strategyFail.success = () => {
    throw new Error('strategy.success should not be called for rejected credentials');
  };
  strategyFail.fail = (info, status) => {
    failInfo = { info, status };
  };
  strategyFail.error = (error) => {
    throw error;
  };

  strategyFail.authenticate({ body: { username: 'bob', password: 'wrong' } });
  assert.deepStrictEqual(failInfo, {
    info: { message: 'Bad credentials' },
    status: undefined,
  });

  const strategyMissing = new Strategy(() => {
    throw new Error('verify callback should not run when credentials are missing');
  });

  let missingCredentials;
  strategyMissing.success = () => {
    throw new Error('strategy.success should not be called when credentials are missing');
  };
  strategyMissing.fail = (info, status) => {
    missingCredentials = { info, status };
  };
  strategyMissing.error = (error) => {
    throw error;
  };

  strategyMissing.authenticate({ body: { username: 'bob' } });
  assert.deepStrictEqual(missingCredentials, {
    info: { message: 'Missing credentials' },
    status: 400,
  });

  return 'PASS: authenticate() fail path and missing-credentials handling';
};
