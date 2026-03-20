import assert from 'assert';
import morgan from 'morgan';

export const run = () => {
  const authHeader = `Basic ${Buffer.from('alice:secret').toString('base64')}`;

  const req = {
    ip: '203.0.113.10',
    method: 'PATCH',
    originalUrl: '/v1/resource?x=1',
    url: '/v1/resource?x=1',
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    headers: {
      authorization: authHeader,
      referer: 'https://example.com/source',
      'user-agent': 'morgan-test-agent',
      'x-request-id': 'req-123',
    },
  };

  const responseHeaders = new Map([
    ['content-type', 'application/json'],
  ]);

  const res = {
    statusCode: 204,
    headersSent: true,
    getHeader: (name) => responseHeaders.get(name.toLowerCase()),
  };

  assert.strictEqual(morgan['remote-user'](req, res), 'alice');
  assert.strictEqual(morgan['remote-addr'](req, res), '203.0.113.10');
  assert.strictEqual(morgan.referrer(req, res), 'https://example.com/source');
  assert.strictEqual(morgan['user-agent'](req, res), 'morgan-test-agent');
  assert.strictEqual(morgan.method(req, res), 'PATCH');
  assert.strictEqual(morgan.url(req, res), '/v1/resource?x=1');
  assert.strictEqual(morgan.status(req, res), '204');
  assert.strictEqual(morgan['http-version'](req, res), '1.1');
  assert.strictEqual(morgan.req(req, res, 'x-request-id'), 'req-123');
  assert.strictEqual(morgan.res(req, res, 'content-type'), 'application/json');
  assert.match(morgan.date(req, res, 'iso'), /^\d{4}-\d{2}-\d{2}T/);
  assert.match(morgan.date(req, res, 'clf'), /^\d{2}\/\w{3}\/\d{4}:/);

  return 'PASS: header, auth, method/url/status, and date tokens behave as expected';
};
