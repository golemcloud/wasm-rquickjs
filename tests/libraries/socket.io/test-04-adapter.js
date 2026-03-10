import assert from 'node:assert';
import { Server } from 'socket.io';

export const run = () => {
  const io = new Server({ serveClient: false });
  const nsp = io.of('/rooms');
  const adapter = nsp.adapter;

  adapter.addAll('socket-1', new Set(['room-a', 'room-b']));
  adapter.addAll('socket-2', new Set(['room-b']));

  assert.deepStrictEqual(adapter.socketRooms('socket-1'), new Set(['room-a', 'room-b']));
  assert.strictEqual(adapter.rooms.get('room-b')?.has('socket-1'), true);
  assert.strictEqual(adapter.rooms.get('room-b')?.has('socket-2'), true);

  adapter.del('socket-1', 'room-a');
  assert.strictEqual(adapter.rooms.has('room-a'), false);

  adapter.delAll('socket-2');
  assert.strictEqual(adapter.sids.has('socket-2'), false);

  return 'PASS: in-memory adapter tracks room membership without a live server';
};
