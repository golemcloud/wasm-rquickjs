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
  const app = new Koa();
  const { req, res } = createMockReqRes({
    headers: { host: 'example.com' },
  });

  const ctx = app.createContext(req, res);
  ctx.status = 201;
  ctx.set('x-alpha', 'one');
  ctx.append('x-alpha', 'two');
  ctx.vary('accept-encoding');
  ctx.attachment('report.txt');
  ctx.body = { ok: true };

  assert.strictEqual(ctx.status, 201);
  assert.ok(String(ctx.response.get('x-alpha')).includes('one'));
  assert.ok(String(ctx.response.get('x-alpha')).includes('two'));
  assert.ok(String(ctx.response.get('vary')).toLowerCase().includes('accept-encoding'));
  assert.ok(String(ctx.response.get('content-disposition')).includes('attachment'));
  assert.ok(String(ctx.response.get('content-disposition')).includes('report.txt'));
  assert.ok(String(ctx.response.get('content-type')).includes('application/json'));

  return 'PASS: response helper methods update headers and metadata';
};
