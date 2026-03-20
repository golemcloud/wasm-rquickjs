import assert from 'assert';
import passportJwt from 'passport-jwt';

const { Strategy: JwtStrategy } = passportJwt;

const execute = (strategy, req) =>
  new Promise((resolve) => {
    strategy.success = (user, info) => resolve({ type: 'success', user, info });
    strategy.fail = (info) => resolve({ type: 'fail', info });
    strategy.error = (err) => resolve({ type: 'error', err });
    strategy.authenticate(req);
  });

export const run = async () => {
  const originalVerifier = JwtStrategy.JwtVerifier;

  try {
    const noTokenStrategy = new JwtStrategy({
      secretOrKey: 'secret',
      jwtFromRequest: () => null,
    }, (_payload, done) => done(null, { id: 'unused' }));

    const noTokenOutcome = await execute(noTokenStrategy, { headers: {}, url: '/no-token' });
    assert.strictEqual(noTokenOutcome.type, 'fail');
    assert.strictEqual(noTokenOutcome.info?.message, 'No auth token');

    JwtStrategy.JwtVerifier = (_token, _secret, _opts, callback) => {
      callback(new Error('invalid signature'));
    };
    const badJwtStrategy = new JwtStrategy({
      secretOrKey: 'secret',
      jwtFromRequest: () => 'bad-token',
    }, (_payload, done) => done(null, { id: 'unused' }));

    const badJwtOutcome = await execute(badJwtStrategy, { headers: {}, url: '/bad-token' });
    assert.strictEqual(badJwtOutcome.type, 'fail');
    assert.strictEqual(badJwtOutcome.info?.message, 'invalid signature');

    JwtStrategy.JwtVerifier = (_token, _secret, _opts, callback) => {
      callback(null, { sub: 'user-1' });
    };
    const rejectedUserStrategy = new JwtStrategy({
      secretOrKey: 'secret',
      jwtFromRequest: () => 'good-token',
    }, (_payload, done) => done(null, false, { reason: 'denied' }));

    const rejectedOutcome = await execute(rejectedUserStrategy, { headers: {}, url: '/rejected' });
    assert.strictEqual(rejectedOutcome.type, 'fail');
    assert.deepStrictEqual(rejectedOutcome.info, { reason: 'denied' });

    const throwingVerifyStrategy = new JwtStrategy({
      secretOrKey: 'secret',
      jwtFromRequest: () => 'good-token',
    }, () => {
      throw new Error('verify exploded');
    });

    const throwingOutcome = await execute(throwingVerifyStrategy, { headers: {}, url: '/throw' });
    assert.strictEqual(throwingOutcome.type, 'error');
    assert.strictEqual(throwingOutcome.err?.message, 'verify exploded');

    const keyProviderFailureStrategy = new JwtStrategy({
      secretOrKeyProvider: (_req, _token, done) => done(new Error('key lookup failed')),
      jwtFromRequest: () => 'good-token',
    }, (_payload, done) => done(null, { id: 'unused' }));

    const keyProviderFailureOutcome = await execute(keyProviderFailureStrategy, { headers: {}, url: '/provider-error' });
    assert.strictEqual(keyProviderFailureOutcome.type, 'fail');
    assert.strictEqual(keyProviderFailureOutcome.info?.message, 'key lookup failed');
  } finally {
    JwtStrategy.JwtVerifier = originalVerifier;
  }

  return 'PASS: authenticate failure and error paths propagate expected callbacks';
};
