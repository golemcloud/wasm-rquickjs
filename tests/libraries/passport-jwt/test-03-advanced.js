import assert from 'assert';
import passportJwt from 'passport-jwt';

const { Strategy: JwtStrategy, ExtractJwt } = passportJwt;

export const run = () => {
  const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  const verify = () => {};

  assert.throws(
    () => new JwtStrategy({ jwtFromRequest }, verify),
    /requires a secret or key/,
  );

  assert.throws(
    () => new JwtStrategy({ secretOrKey: 'secret' }, verify),
    /requires a function to retrieve jwt from requests/,
  );

  assert.throws(
    () => new JwtStrategy({ secretOrKey: 'secret', jwtFromRequest }, null),
    /requires a verify callback/,
  );

  assert.throws(
    () => new JwtStrategy({
      secretOrKey: 'secret',
      secretOrKeyProvider: (_req, _rawJwt, done) => done(null, 'other-secret'),
      jwtFromRequest,
    }, verify),
    /both a secretOrKey and a secretOrKeyProvider/,
  );

  const strategy = new JwtStrategy({
    secretOrKey: 'secret',
    jwtFromRequest,
    audience: 'aud',
    issuer: 'iss',
    algorithms: ['HS256'],
    ignoreExpiration: true,
    jsonWebTokenOptions: {
      clockTolerance: 15,
      maxAge: '1h',
    },
  }, verify);

  assert.strictEqual(strategy.name, 'jwt');
  assert.deepStrictEqual(strategy._verifOpts, {
    clockTolerance: 15,
    maxAge: '1h',
    audience: 'aud',
    issuer: 'iss',
    algorithms: ['HS256'],
    ignoreExpiration: true,
  });

  return 'PASS: constructor validation and verifier options merging behave as expected';
};
