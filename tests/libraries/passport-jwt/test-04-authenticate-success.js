import assert from 'assert';
import passportJwt from 'passport-jwt';

const { Strategy: JwtStrategy, ExtractJwt } = passportJwt;

export const run = async () => {
  const originalVerifier = JwtStrategy.JwtVerifier;

  try {
    const seen = {};
    const strategy = new JwtStrategy({
      secretOrKey: 'test-secret',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
    }, (req, payload, done) => {
      seen.verifyReq = req;
      seen.verifyPayload = payload;
      done(null, { id: payload.sub }, { scope: 'read' });
    });

    const req = {
      method: 'GET',
      url: '/private',
      headers: { authorization: 'Bearer signed-token' },
    };

    JwtStrategy.JwtVerifier = (token, secretOrKey, options, callback) => {
      seen.token = token;
      seen.secretOrKey = secretOrKey;
      seen.options = options;
      callback(null, { sub: 'user-123' });
    };

    const outcome = await new Promise((resolve, reject) => {
      strategy.success = (user, info) => resolve({ type: 'success', user, info });
      strategy.fail = (info) => reject(new Error(`Unexpected fail: ${info?.message || info}`));
      strategy.error = reject;
      strategy.authenticate(req);
    });

    assert.strictEqual(outcome.type, 'success');
    assert.deepStrictEqual(outcome.user, { id: 'user-123' });
    assert.deepStrictEqual(outcome.info, { scope: 'read' });
    assert.strictEqual(seen.token, 'signed-token');
    assert.strictEqual(seen.secretOrKey, 'test-secret');
    assert.strictEqual(seen.verifyReq, req);
    assert.deepStrictEqual(seen.verifyPayload, { sub: 'user-123' });
    assert.strictEqual(seen.options.ignoreExpiration, false);
  } finally {
    JwtStrategy.JwtVerifier = originalVerifier;
  }

  return 'PASS: authenticate success path calls verifier and success callback';
};
