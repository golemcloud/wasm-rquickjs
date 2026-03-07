import assert from 'assert';
import { EventEmitter } from 'events';
import { Readable } from 'stream';
import Koa from 'koa';

function createMockReqRes({ url = '/', method = 'GET', headers = {} } = {}) {
  const req = new Readable({ read() {} });
  req.url = url;
  req.method = method;
  req.headers = headers;
  req.socket = new EventEmitter();
  req.socket.encrypted = false;
  req.socket.remoteAddress = '127.0.0.1';
  req.socket.writable = true;

  const res = new EventEmitter();
  res.statusCode = 200;
  res.statusMessage = 'OK';
  res._headers = {};
  res.headersSent = false;
  res.finished = false;
  res.writableEnded = false;
  res.socket = new EventEmitter();
  res.socket.writable = true;

  res.getHeader = (name) => res._headers[name.toLowerCase()];
  res.setHeader = (name, value) => {
    res._headers[name.toLowerCase()] = value;
  };
  res.hasHeader = (name) => Object.prototype.hasOwnProperty.call(res._headers, name.toLowerCase());
  res.removeHeader = (name) => {
    delete res._headers[name.toLowerCase()];
  };
  res.write = () => true;
  res.end = () => {
    res.finished = true;
    res.writableEnded = true;
    res.headersSent = true;
    res.emit('finish');
    return res;
  };

  return { req, res };
}

export const run = () => {
  const app = new Koa({ proxy: true, subdomainOffset: 2 });
  const { req, res } = createMockReqRes({
    url: '/docs/page?foo=1&bar=two',
    headers: {
      host: 'api.v1.example.com',
      'x-forwarded-proto': 'https',
    },
  });

  const ctx = app.createContext(req, res);

  assert.strictEqual(ctx.path, '/docs/page');
  assert.strictEqual(ctx.query.foo, '1');
  assert.strictEqual(ctx.query.bar, 'two');
  assert.strictEqual(ctx.querystring, 'foo=1&bar=two');
  assert.strictEqual(ctx.host, 'api.v1.example.com');
  assert.strictEqual(ctx.hostname, 'api.v1.example.com');
  assert.strictEqual(ctx.protocol, 'https');
  assert.strictEqual(ctx.secure, true);
  assert.deepStrictEqual(ctx.subdomains, ['v1', 'api']);

  return 'PASS: request parsing and proxy-aware getters work';
};
