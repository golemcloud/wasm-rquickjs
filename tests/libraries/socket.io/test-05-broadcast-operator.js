import assert from 'node:assert';
import { Server } from 'socket.io';

export const run = () => {
  const io = new Server({ serveClient: false });

  const op = io
    .to('room-1')
    .in('room-2')
    .except('room-3')
    .local
    .timeout(1500)
    .compress(false);

  assert.deepStrictEqual(op.rooms, new Set(['room-1', 'room-2']));
  assert.deepStrictEqual(op.exceptRooms, new Set(['room-3']));
  assert.strictEqual(op.flags.local, true);
  assert.strictEqual(op.flags.timeout, 1500);
  assert.strictEqual(op.flags.compress, false);

  return 'PASS: broadcast operator tracks rooms and flags before emission';
};
