import assert from 'assert';
import { io } from 'socket.io-client';

export const run = () => {
  const socket = io('https://example.com', { autoConnect: false });

  const seen = [];
  const onMessage = (payload) => {
    seen.push(`on:${payload}`);
  };

  socket.on('message', onMessage);
  socket.once('only-once', () => {
    seen.push('once');
  });

  socket.emitReserved('message', 'hello');
  socket.emitReserved('only-once');
  socket.emitReserved('only-once');

  assert.deepStrictEqual(seen, ['on:hello', 'once']);

  socket.off('message', onMessage);
  socket.emitReserved('message', 'world');
  assert.deepStrictEqual(seen, ['on:hello', 'once'], 'off() should remove the listener');

  const anyIncoming = [];
  socket.onAny((event, ...args) => {
    anyIncoming.push({ event, args });
  });

  assert.strictEqual(typeof socket.emitEvent, 'function', 'socket should expose emitEvent');
  socket.emitEvent(['incoming-event', 1, 2, 3]);
  assert.strictEqual(anyIncoming.length, 1);
  assert.strictEqual(anyIncoming[0].event, 'incoming-event');
  assert.deepStrictEqual(anyIncoming[0].args, [1, 2, 3]);

  socket.offAny();
  assert.strictEqual(socket.listenersAny().length, 0);

  return 'PASS: on/off/once plus onAny/offAny listener APIs work';
};
