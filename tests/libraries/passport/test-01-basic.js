import assert from 'assert';
import passport from 'passport';

class SuccessStrategy extends passport.Strategy {
  constructor() {
    super();
    this.name = 'success';
  }

  authenticate() {
    this.success({ id: 'user-1' }, { scope: 'basic' });
  }
}

export const run = async () => {
  const auth = new passport.Passport();

  auth.use(new SuccessStrategy());
  assert.ok(auth._strategy('success'), 'registered strategy should be available');

  const callbackPayload = await new Promise((resolve, reject) => {
    const middleware = auth.authenticate('success', { session: false }, (err, user, info, status) => {
      resolve({ err, user, info, status });
    });

    const req = { headers: {} };
    const res = {
      setHeader() {},
      end() {
        reject(new Error('authenticate callback flow should not end response directly'));
      },
      statusCode: 200,
    };

    middleware(req, res, (err) => {
      if (err) {
        reject(err);
      }
    });
  });

  assert.strictEqual(callbackPayload.err, null);
  assert.deepStrictEqual(callbackPayload.user, { id: 'user-1' });
  assert.deepStrictEqual(callbackPayload.info, { scope: 'basic' });
  assert.strictEqual(callbackPayload.status, undefined);

  auth.unuse('success');
  assert.strictEqual(auth._strategy('success'), undefined, 'unregistered strategy should be removed');

  return 'PASS: strategy registration and callback authenticate flow works';
};
