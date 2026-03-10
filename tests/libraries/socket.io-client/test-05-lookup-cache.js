import assert from 'assert';
import { io } from 'socket.io-client';

export const run = () => {
  const socketA = io('https://example.com/chat', { autoConnect: false });
  const socketB = io('https://example.com/metrics', { autoConnect: false });

  assert.strictEqual(
    socketA.io,
    socketB.io,
    'default lookup should multiplex namespaces through one Manager for same origin/path'
  );

  const socketForceNew = io('https://example.com/alerts', {
    autoConnect: false,
    forceNew: true,
  });
  assert.notStrictEqual(socketForceNew.io, socketA.io, 'forceNew should bypass Manager cache');

  const socketNoMultiplex = io('https://example.com/reports', {
    autoConnect: false,
    multiplex: false,
  });
  assert.notStrictEqual(socketNoMultiplex.io, socketA.io, 'multiplex=false should create a new Manager');

  const socketDifferentPath = io('https://example.com/anything', {
    autoConnect: false,
    path: '/custom-socket.io',
  });
  assert.notStrictEqual(
    socketDifferentPath.io,
    socketA.io,
    'different socket.io path should produce a distinct Manager cache key'
  );

  return 'PASS: lookup cache, forceNew, multiplex, and custom path behaviors work';
};
