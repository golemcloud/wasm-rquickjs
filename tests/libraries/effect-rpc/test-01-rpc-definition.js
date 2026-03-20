import assert from 'node:assert';
import { Rpc } from '@effect/rpc';
import { Schema } from 'effect';

export const run = () => {
  const Echo = Rpc.make('Echo', {
    payload: {
      message: Schema.String,
    },
    success: Schema.String,
    error: Schema.String,
  });

  assert.strictEqual(Echo._tag, 'Echo');
  assert.strictEqual(Echo.key, '@effect/rpc/Rpc/Echo');
  assert.ok(Echo.payloadSchema.make);

  const payload = Echo.payloadSchema.make({ message: 'hello' });
  assert.strictEqual(payload.message, 'hello');

  const Prefixed = Echo.prefix('demo.');
  assert.strictEqual(Prefixed._tag, 'demo.Echo');
  assert.strictEqual(Prefixed.key, '@effect/rpc/Rpc/demo.Echo');

  return 'PASS: Rpc.make creates payload/success/error schemas and supports prefixing';
};
