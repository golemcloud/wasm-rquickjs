import assert from 'assert';
import passport from 'passport';

class FailStrategy extends passport.Strategy {
  constructor() {
    super();
    this.name = 'fail';
  }

  authenticate() {
    this.fail('Basic realm="users"', 401);
  }
}

class ErrorStrategy extends passport.Strategy {
  constructor() {
    super();
    this.name = 'explode';
  }

  authenticate() {
    this.error(new Error('kaboom'));
  }
}

export const run = async () => {
  const auth = new passport.Passport();
  auth.use(new FailStrategy());
  auth.use(new ErrorStrategy());

  const failureResponse = await new Promise((resolve, reject) => {
    const middleware = auth.authenticate('fail', { session: false });

    const req = { headers: {} };
    let statusCode = 200;
    const headers = {};
    const res = {
      get statusCode() {
        return statusCode;
      },
      set statusCode(value) {
        statusCode = value;
      },
      setHeader(name, value) {
        headers[name] = value;
      },
      end(body) {
        resolve({ statusCode, headers, body });
      },
    };

    middleware(req, res, (err) => {
      if (err) {
        reject(err);
      }
    });
  });

  assert.strictEqual(failureResponse.statusCode, 401);
  assert.ok(Array.isArray(failureResponse.headers['WWW-Authenticate']));
  assert.ok(failureResponse.headers['WWW-Authenticate'].includes('Basic realm="users"'));
  assert.strictEqual(failureResponse.body, 'Unauthorized');

  const strategyError = await new Promise((resolve, reject) => {
    const middleware = auth.authenticate('explode', { session: false });

    const req = { headers: {} };
    const res = {
      setHeader() {},
      end() {
        reject(new Error('strategy error should be routed to next(err)'));
      },
      statusCode: 200,
    };

    middleware(req, res, (err) => {
      if (!err) {
        reject(new Error('expected strategy error to be forwarded'));
      } else {
        resolve(err);
      }
    });
  });

  assert.strictEqual(strategyError.message, 'kaboom');

  return 'PASS: authenticate failure responses and strategy errors are surfaced correctly';
};
