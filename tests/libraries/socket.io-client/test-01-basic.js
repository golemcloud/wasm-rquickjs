import assert from 'assert';
import { Manager, Socket, io, protocol } from 'socket.io-client';

export const run = () => {
  assert.strictEqual(protocol, 5, 'socket.io protocol version should be 5');

  const socket = io('https://example.com/orders', { autoConnect: false });

  assert.ok(socket instanceof Socket, 'io() should return a Socket instance');
  assert.ok(socket.io instanceof Manager, 'socket.io should hold a Manager instance');
  assert.strictEqual(socket.nsp, '/orders', 'namespace should be parsed from URL path');
  assert.strictEqual(socket.connected, false, 'socket should start disconnected');
  assert.strictEqual(socket.disconnected, true, 'disconnected getter should mirror connected state');
  assert.strictEqual(socket.active, false, 'socket should be inactive before connect()');
  assert.strictEqual(socket.sendBuffer.length, 0, 'send buffer should start empty');

  return 'PASS: basic exports and socket construction work';
};
