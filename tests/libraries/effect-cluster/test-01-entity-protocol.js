import assert from 'node:assert';
import { ClusterSchema, Entity, EntityId } from '@effect/cluster';
import { Rpc } from '@effect/rpc';
import { Context, Schema } from 'effect';

const Ping = Rpc.make('Ping', {
  payload: {
    value: Schema.String,
  },
  success: Schema.String,
}).annotate(ClusterSchema.Persisted, true);

const Sum = Rpc.make('Sum', {
  payload: {
    left: Schema.Number,
    right: Schema.Number,
  },
  success: Schema.Number,
}).annotate(ClusterSchema.Uninterruptible, 'server');

const MathEntity = Entity.make('MathEntity', [Ping, Sum]).annotate(
  ClusterSchema.ShardGroup,
  (entityId) => (entityId.startsWith('vip-') ? 'vip' : 'default')
);

export const run = () => {
  assert.strictEqual(MathEntity.type, 'MathEntity');
  assert.strictEqual(MathEntity.getShardGroup(EntityId.make('vip-42')), 'vip');
  assert.strictEqual(MathEntity.getShardGroup(EntityId.make('user-9')), 'default');

  const pingRpc = MathEntity.protocol.requests.get('Ping');
  const sumRpc = MathEntity.protocol.requests.get('Sum');

  assert.ok(pingRpc, 'Ping RPC should be present in protocol.requests');
  assert.ok(sumRpc, 'Sum RPC should be present in protocol.requests');

  assert.strictEqual(
    Context.getOption(pingRpc.annotations, ClusterSchema.Persisted)._tag,
    'Some'
  );
  assert.strictEqual(
    Context.getOption(pingRpc.annotations, ClusterSchema.Persisted).value,
    true
  );

  assert.strictEqual(
    Context.getOption(sumRpc.annotations, ClusterSchema.Uninterruptible)._tag,
    'Some'
  );
  assert.strictEqual(
    Context.getOption(sumRpc.annotations, ClusterSchema.Uninterruptible).value,
    'server'
  );

  return 'PASS: Entity.make and ClusterSchema annotations define protocol + shard grouping';
};
