import assert from 'assert';
import passport from 'passport';

const transform = (auth, info) =>
  new Promise((resolve, reject) => {
    auth.transformAuthInfo(info, (err, transformed) => {
      if (err) {
        reject(err);
      } else {
        resolve(transformed);
      }
    });
  });

export const run = async () => {
  const auth = new passport.Passport();

  auth.transformAuthInfo((info, done) => {
    done('pass');
  });
  auth.transformAuthInfo((info, done) => {
    done(null, { ...info, transformed: true });
  });

  const transformed = await transform(auth, { scope: 'read' });
  assert.deepStrictEqual(transformed, {
    scope: 'read',
    transformed: true,
  });

  const authFirstWins = new passport.Passport();
  authFirstWins.transformAuthInfo((info, done) => {
    done(null, { ...info, winner: 'first' });
  });
  authFirstWins.transformAuthInfo(() => {
    throw new Error('second transformer should not run when first returns transformed info');
  });

  const firstWins = await transform(authFirstWins, { scope: 'write' });
  assert.deepStrictEqual(firstWins, { scope: 'write', winner: 'first' });

  const authWithoutTransforms = new passport.Passport();
  const passthrough = await transform(authWithoutTransforms, { role: 'admin' });
  assert.deepStrictEqual(passthrough, { role: 'admin' });

  return 'PASS: transformAuthInfo applies registered transformers and default passthrough';
};
