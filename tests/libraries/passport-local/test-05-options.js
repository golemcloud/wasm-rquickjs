import assert from 'assert';
import Strategy from 'passport-local';

export const run = () => {
  const strategyCustomFields = new Strategy(
    { usernameField: 'email', passwordField: 'token' },
    (username, password, done) => {
      assert.strictEqual(username, 'a@example.com');
      assert.strictEqual(password, 'abc123');
      done(null, { id: 1 });
    }
  );

  let customFieldsUser;
  strategyCustomFields.success = (user) => {
    customFieldsUser = user;
  };
  strategyCustomFields.fail = () => {
    throw new Error('strategy.fail should not be called for custom field success case');
  };
  strategyCustomFields.error = (error) => {
    throw error;
  };

  strategyCustomFields.authenticate({ body: { email: 'a@example.com', token: 'abc123' } });
  assert.deepStrictEqual(customFieldsUser, { id: 1 });

  const strategyReqQuery = new Strategy((username, password, done) => {
    assert.strictEqual(username, 'eve');
    assert.strictEqual(password, 'query-pass');
    done(null, { id: 2 });
  });

  let queryUser;
  strategyReqQuery.success = (user) => {
    queryUser = user;
  };
  strategyReqQuery.fail = () => {
    throw new Error('strategy.fail should not be called for query credential success case');
  };
  strategyReqQuery.error = (error) => {
    throw error;
  };

  strategyReqQuery.authenticate({ query: { username: 'eve', password: 'query-pass' } });
  assert.deepStrictEqual(queryUser, { id: 2 });

  const strategyReqForwarded = new Strategy(
    { passReqToCallback: true },
    (req, username, password, done) => {
      assert.strictEqual(req.traceId, 'req-123');
      assert.strictEqual(username, 'frank');
      assert.strictEqual(password, 'pw');
      done(null, { id: 3, traceId: req.traceId });
    }
  );

  let forwardedUser;
  strategyReqForwarded.success = (user) => {
    forwardedUser = user;
  };
  strategyReqForwarded.fail = () => {
    throw new Error('strategy.fail should not be called for passReqToCallback success case');
  };
  strategyReqForwarded.error = (error) => {
    throw error;
  };

  strategyReqForwarded.authenticate({ body: { username: 'frank', password: 'pw' }, traceId: 'req-123' });
  assert.deepStrictEqual(forwardedUser, { id: 3, traceId: 'req-123' });

  const strategyBadRequestMessage = new Strategy(() => {
    throw new Error('verify callback should not run when credentials are missing and options override message');
  });

  let badRequest;
  strategyBadRequestMessage.success = () => {
    throw new Error('strategy.success should not be called when credentials are missing');
  };
  strategyBadRequestMessage.fail = (info, status) => {
    badRequest = { info, status };
  };
  strategyBadRequestMessage.error = (error) => {
    throw error;
  };

  strategyBadRequestMessage.authenticate({ body: {} }, { badRequestMessage: 'Custom missing creds' });
  assert.deepStrictEqual(badRequest, {
    info: { message: 'Custom missing creds' },
    status: 400,
  });

  return 'PASS: custom fields, query lookup, passReqToCallback, and badRequestMessage';
};
