import assert from 'assert';
import { io } from 'socket.io-client';

export const run = () => {
  const socket = io('https://example.com', { autoConnect: false });

  const outgoing = [];
  socket.onAnyOutgoing((event, ...args) => {
    outgoing.push({ event, args });
  });
  assert.strictEqual(socket.listenersAnyOutgoing().length, 1, 'onAnyOutgoing should register listeners');

  socket.emit('plain-event', { answer: 42 });
  assert.strictEqual(socket.sendBuffer.length, 1, 'plain emit should queue when disconnected');
  assert.strictEqual(socket.sendBuffer[0].data[0], 'plain-event');
  assert.deepStrictEqual(socket.sendBuffer[0].data[1], { answer: 42 });
  assert.strictEqual(socket.sendBuffer[0].options.compress, true, 'default compress flag should be true');

  socket.compress(false).emit('no-compress', 'payload');
  assert.strictEqual(socket.sendBuffer.length, 2);
  assert.strictEqual(socket.sendBuffer[1].data[0], 'no-compress');
  assert.strictEqual(socket.sendBuffer[1].options.compress, false);

  const beforeVolatile = socket.sendBuffer.length;
  socket.volatile.emit('drop-when-disconnected', 'value');
  assert.strictEqual(
    socket.sendBuffer.length,
    beforeVolatile,
    'volatile packets should be discarded when transport is not writable'
  );

  assert.strictEqual(outgoing.length, 0, 'outgoing listeners are not notified until packets are sent');

  socket.offAnyOutgoing();
  assert.strictEqual(socket.listenersAnyOutgoing().length, 0);

  return 'PASS: disconnected buffering, compress flag, volatile semantics, and outgoing listener registration work';
};
