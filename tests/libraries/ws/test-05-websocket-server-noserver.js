import assert from 'assert';
import { WebSocketServer } from 'ws';

export const run = () => {
  const wss = new WebSocketServer({
    noServer: true,
    path: '/socket',
  });

  assert.strictEqual(wss.shouldHandle({ url: '/socket' }), true);
  assert.strictEqual(wss.shouldHandle({ url: '/other' }), false);
  assert.strictEqual(wss.clients instanceof Set, true);

  wss.close();

  return 'PASS: WebSocketServer supports noServer mode path filtering';
};
