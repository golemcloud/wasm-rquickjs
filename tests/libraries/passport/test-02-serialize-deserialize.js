import assert from 'assert';
import passport from 'passport';

const serialize = (auth, user) =>
  new Promise((resolve, reject) => {
    auth.serializeUser(user, (err, obj) => {
      if (err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });

const deserialize = (auth, obj) =>
  new Promise((resolve, reject) => {
    auth.deserializeUser(obj, (err, user) => {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });

export const run = async () => {
  const auth = new passport.Passport();

  auth.serializeUser((_user, done) => {
    done('pass');
  });
  auth.serializeUser((user, done) => {
    done(null, `${user.tenant}:${user.id}`);
  });

  const token = await serialize(auth, { tenant: 'acme', id: 7 });
  assert.strictEqual(token, 'acme:7');

  auth.deserializeUser((_token, done) => {
    done('pass');
  });
  auth.deserializeUser((tokenValue, done) => {
    const [tenant, rawId] = tokenValue.split(':');
    done(null, { tenant, id: Number(rawId) });
  });

  const user = await deserialize(auth, token);
  assert.deepStrictEqual(user, { tenant: 'acme', id: 7 });

  return 'PASS: serializeUser/deserializeUser chaining and pass semantics work';
};
