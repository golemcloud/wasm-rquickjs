import assert from 'assert';
import WebSocket, { WebSocketServer, Receiver, Sender, createWebSocketStream } from 'ws';

export const run = () => {
  assert.strictEqual(typeof WebSocket, 'function');
  assert.strictEqual(typeof WebSocketServer, 'function');
  assert.strictEqual(typeof Receiver, 'function');
  assert.strictEqual(typeof Sender, 'function');
  assert.strictEqual(typeof createWebSocketStream, 'function');

  assert.strictEqual(WebSocket.CONNECTING, 0);
  assert.strictEqual(WebSocket.OPEN, 1);
  assert.strictEqual(WebSocket.CLOSING, 2);
  assert.strictEqual(WebSocket.CLOSED, 3);
  assert.strictEqual(WebSocketServer.prototype.constructor.name, 'WebSocketServer');

  return 'PASS: ws exports and ready-state constants are available';
};
