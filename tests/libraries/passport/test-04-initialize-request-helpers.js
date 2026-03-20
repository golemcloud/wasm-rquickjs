import assert from 'assert';
import passport from 'passport';

const login = (req, user, options) =>
  new Promise((resolve, reject) => {
    req.logIn(user, options, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

const logout = (req, options) =>
  new Promise((resolve, reject) => {
    req.logOut(options, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

export const run = async () => {
  const auth = new passport.Passport();
  auth.serializeUser((user, done) => {
    done(null, user.id);
  });

  const middleware = auth.initialize({ userProperty: 'account' });

  const req = {
    headers: {},
    session: {
      marker: 'seed',
      regenerate(done) {
        done();
      },
      save(done) {
        done();
      },
    },
  };
  const res = {};

  await new Promise((resolve, reject) => {
    middleware(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  assert.strictEqual(typeof req.logIn, 'function');
  assert.strictEqual(typeof req.logOut, 'function');
  assert.strictEqual(typeof req.isAuthenticated, 'function');
  assert.strictEqual(typeof req.isUnauthenticated, 'function');

  await login(req, { id: 42, name: 'Alice' }, { keepSessionInfo: true });
  assert.deepStrictEqual(req.account, { id: 42, name: 'Alice' });
  assert.strictEqual(req.isAuthenticated(), true);
  assert.strictEqual(req.isUnauthenticated(), false);
  assert.strictEqual(req.session.passport.user, 42);
  assert.strictEqual(req.session.marker, 'seed');

  await logout(req, { keepSessionInfo: true });
  assert.strictEqual(req.account, null);
  assert.strictEqual(req.isAuthenticated(), false);
  assert.strictEqual(req.isUnauthenticated(), true);
  assert.strictEqual(req.session.passport.user, undefined);

  return 'PASS: initialize middleware installs request helpers and custom userProperty support';
};
