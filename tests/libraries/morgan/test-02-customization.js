import assert from 'assert';
import morgan from 'morgan';

export const run = () => {
  morgan.token('trace-id', (req) => req.headers['x-trace-id'] || 'none');
  morgan.format('trace-format', (tokens, req, res) => {
    return `${tokens.method(req, res)} ${tokens['trace-id'](req, res)}`;
  });

  const req = {
    method: 'PUT',
    headers: {
      'x-trace-id': 'trace-42',
    },
  };

  const res = {
    getHeader: () => undefined,
  };

  const line = morgan['trace-format'](morgan, req, res);
  assert.strictEqual(line, 'PUT trace-42');

  return 'PASS: custom token and function format registration works';
};
