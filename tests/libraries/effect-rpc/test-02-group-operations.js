import assert from 'node:assert';
import { Rpc, RpcGroup } from '@effect/rpc';
import { Schema } from 'effect';

export const run = () => {
  const Ping = Rpc.make('Ping', { success: Schema.String });
  const Add = Rpc.make('Add', {
    payload: {
      a: Schema.Number,
      b: Schema.Number,
    },
    success: Schema.Number,
  });

  const base = RpcGroup.make(Ping);
  const extended = base.add(Add);
  assert.strictEqual(extended.requests.size, 2);
  assert.ok(extended.requests.has('Ping'));
  assert.ok(extended.requests.has('Add'));

  const prefixed = RpcGroup.make(Add).prefix('math.');
  assert.ok(prefixed.requests.has('math.Add'));

  const merged = extended.merge(prefixed);
  assert.strictEqual(merged.requests.size, 3);
  assert.ok(merged.requests.has('math.Add'));

  return 'PASS: RpcGroup supports add/merge/prefix operations';
};
