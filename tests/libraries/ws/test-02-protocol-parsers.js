import assert from 'assert';
import { format as formatExtensions, parse as parseExtensions } from './node_modules/ws/lib/extension.js';
import { parse as parseSubprotocol } from './node_modules/ws/lib/subprotocol.js';

export const run = () => {
  const parsedExtensions = parseExtensions('permessage-deflate; client_max_window_bits=10; server_no_context_takeover');
  assert.ok(parsedExtensions['permessage-deflate']);

  const formattedExtensions = formatExtensions({
    'permessage-deflate': [{ client_max_window_bits: 10, server_no_context_takeover: true }],
  });
  assert.ok(formattedExtensions.includes('permessage-deflate'));
  assert.ok(formattedExtensions.includes('client_max_window_bits=10'));
  assert.ok(formattedExtensions.includes('server_no_context_takeover'));

  const protocols = parseSubprotocol('chat, superchat, telemetry.v1');
  assert.strictEqual(protocols.has('chat'), true);
  assert.strictEqual(protocols.has('superchat'), true);
  assert.strictEqual(protocols.has('telemetry.v1'), true);
  assert.strictEqual(protocols.size, 3);

  return 'PASS: extension and subprotocol header parsing works';
};
