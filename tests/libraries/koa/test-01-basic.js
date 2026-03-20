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
  res.write = (chunk) => {
    const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    res.body = (res.body ?? '') + text;
    return true;
  };
  res.end = (chunk = '') => {
    if (chunk !== undefined) {
      const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      res.body = (res.body ?? '') + text;
    }
    res.finished = true;
    res.writableEnded = true;
    res.headersSent = true;
    res.emit('finish');
    return res;
  };

  return { req, res };
}

export const run = async () => {
  const app = new Koa();
  app.use(async (ctx) => {
    ctx.set('x-test', 'true');
    ctx.body = 'hello koa';
  });

  const { req, res } = createMockReqRes({
    url: '/hello?name=koa',
    headers: { host: 'example.com' },
  });

  await app.callback()(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body, 'hello koa');
  assert.strictEqual(res.getHeader('x-test'), 'true');
  assert.ok(String(res.getHeader('content-type')).includes('text/plain'));

  return 'PASS: basic middleware callback response works';
};
