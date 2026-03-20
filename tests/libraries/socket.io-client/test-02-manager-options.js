import assert from 'assert';
import { Manager } from 'socket.io-client';

export const run = () => {
  const manager = new Manager('https://example.com', {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 200,
    reconnectionDelayMax: 800,
    randomizationFactor: 0,
    reconnectionAttempts: 3,
    timeout: 2500,
    path: '/socket.io',
  });

  assert.strictEqual(manager.reconnection(), true);
  assert.strictEqual(manager.reconnectionDelay(), 200);
  assert.strictEqual(manager.reconnectionDelayMax(), 800);
  assert.strictEqual(manager.randomizationFactor(), 0);
  assert.strictEqual(manager.reconnectionAttempts(), 3);
  assert.strictEqual(manager.timeout(), 2500);

  manager.reconnection(false);
  manager.reconnectionDelay(100);
  manager.reconnectionDelayMax(400);
  manager.randomizationFactor(0);
  manager.reconnectionAttempts(4);
  manager.timeout(1000);

  assert.strictEqual(manager.reconnection(), false);
  assert.strictEqual(manager.reconnectionDelay(), 100);
  assert.strictEqual(manager.reconnectionDelayMax(), 400);
  assert.strictEqual(manager.reconnectionAttempts(), 4);
  assert.strictEqual(manager.timeout(), 1000);

  manager.backoff.reset();
  const d1 = manager.backoff.duration();
  const d2 = manager.backoff.duration();
  const d3 = manager.backoff.duration();
  const d4 = manager.backoff.duration();

  assert.strictEqual(d1, 100);
  assert.strictEqual(d2, 200);
  assert.strictEqual(d3, 400);
  assert.strictEqual(d4, 400, 'backoff should cap at reconnectionDelayMax');

  return 'PASS: manager option getters/setters and backoff behavior work';
};
