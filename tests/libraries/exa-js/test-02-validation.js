import assert from 'assert';
import Exa, { ExaError, HttpStatusCode } from 'exa-js';

export const run = async () => {
  const previous = process.env.EXA_API_KEY;
  delete process.env.EXA_API_KEY;

  try {
    assert.throws(
      () => new Exa(),
      (err) => {
        assert.ok(err instanceof ExaError);
        assert.strictEqual(err.statusCode, HttpStatusCode.Unauthorized);
        assert.match(err.message, /EXA_API_KEY/);
        return true;
      }
    );
  } finally {
    if (previous === undefined) {
      delete process.env.EXA_API_KEY;
    } else {
      process.env.EXA_API_KEY = previous;
    }
  }

  const exa = new Exa('test-api-key', 'http://localhost:18080');

  await assert.rejects(
    exa.getContents([]),
    (err) => {
      assert.ok(err instanceof ExaError);
      assert.strictEqual(err.statusCode, HttpStatusCode.BadRequest);
      assert.match(err.message, /Must provide at least one URL/);
      return true;
    }
  );

  await assert.rejects(
    exa.answer('hello', { stream: true }),
    (err) => {
      assert.ok(err instanceof ExaError);
      assert.strictEqual(err.statusCode, HttpStatusCode.BadRequest);
      assert.match(err.message, /streamAnswer\(\)/);
      return true;
    }
  );

  return 'PASS: constructor and input validation errors are reported as ExaError';
};
