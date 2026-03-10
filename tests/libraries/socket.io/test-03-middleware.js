import assert from 'node:assert';
import { Server } from 'socket.io';

export const run = async () => {
  const io = new Server({ serveClient: false });
  const nsp = io.of('/middleware');
  const calls = [];

  io.use((_socket, next) => {
    calls.push('io');
    next();
  });

  nsp.use((_socket, next) => {
    calls.push('nsp');
    next();
  });

  assert.strictEqual(io.of('/')._fns.length, 1);
  assert.strictEqual(nsp._fns.length, 1);

  await new Promise((resolve, reject) => {
    io.of('/')._fns[0]({}, (err) => (err ? reject(err) : resolve()));
  });

  await new Promise((resolve, reject) => {
    nsp._fns[0]({}, (err) => (err ? reject(err) : resolve()));
  });

  assert.deepStrictEqual(calls, ['io', 'nsp']);

  return 'PASS: middleware registration works for root and custom namespaces';
};
