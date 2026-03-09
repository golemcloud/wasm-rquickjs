import assert from 'assert';
import pino from 'pino';

export const run = () => {
  const lines = [];
  const logger = pino(
    {
      base: null,
      redact: ['secret.token'],
      serializers: {
        user: (value) => ({ id: value.id }),
      },
    },
    {
      write: (chunk) => {
        lines.push(chunk.toString().trim());
      },
    }
  );

  logger.info(
    {
      secret: { token: 'top-secret' },
      user: { id: 7, role: 'admin' },
    },
    'serialize and redact'
  );

  assert.strictEqual(lines.length, 1);
  const payload = JSON.parse(lines[0]);
  assert.strictEqual(payload.secret.token, '[Redacted]');
  assert.deepStrictEqual(payload.user, { id: 7 });
  assert.strictEqual(payload.msg, 'serialize and redact');

  return 'PASS: redaction and serializers transform payload fields';
};
