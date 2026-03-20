import assert from 'assert';
import morgan from 'morgan';

export const run = () => {
  const format = morgan.compile(':method :url :status :http-version');

  const req = {
    method: 'POST',
    originalUrl: '/orders?limit=1',
    url: '/orders?limit=1',
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    headers: {},
  };

  const res = {
    statusCode: 201,
    headersSent: true,
    getHeader: () => undefined,
  };

  const line = format(morgan, req, res);
  assert.strictEqual(line, 'POST /orders?limit=1 201 1.1');

  return 'PASS: compile() renders core built-in tokens';
};
