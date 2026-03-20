import assert from 'node:assert';
import { Server } from 'socket.io';

export const run = () => {
  const io = new Server({
    serveClient: false,
    path: '/rt',
    connectTimeout: 1234,
  });

  assert.strictEqual(io.path(), '/rt');
  assert.strictEqual(io.connectTimeout(), 1234);
  assert.strictEqual(io.serveClient(), false);

  io.path('/events');
  io.connectTimeout(4321);
  io.serveClient(true);

  assert.strictEqual(io.path(), '/events');
  assert.strictEqual(io.connectTimeout(), 4321);
  assert.strictEqual(io.serveClient(), true);

  return 'PASS: socket.io server options and setters work without binding';
};
