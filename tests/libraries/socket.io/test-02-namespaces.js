import assert from 'node:assert';
import { Server } from 'socket.io';

export const run = () => {
  const io = new Server({ serveClient: false });

  const root = io.of('/');
  const chatA = io.of('/chat');
  const chatB = io.of('/chat');
  const regexParent = io.of(/^\/room-\d+$/);
  const functionParent = io.of((name, auth, next) => {
    next(null, name.startsWith('/tenant-'));
  });

  assert.strictEqual(root.name, '/');
  assert.strictEqual(chatA, chatB);
  assert.notStrictEqual(regexParent, undefined);
  assert.notStrictEqual(functionParent, undefined);

  return 'PASS: namespace creation works for static, regex, and function namespaces';
};
