import assert from 'node:assert';
import { Headers } from '@effect/platform';
import { EntityAddress, EntityId, EntityType, Envelope, MachineId, Message, ShardId, Snowflake } from '@effect/cluster';
import { Rpc } from '@effect/rpc';
import { Context, Effect, Option, Schema } from 'effect';

const Ping = Rpc.make('Ping', {
  payload: {
    value: Schema.String,
  },
  success: Schema.String,
});

const requestId = Snowflake.make({
  machineId: MachineId.make(7),
  sequence: 11,
  timestamp: Snowflake.constEpochMillis + 321,
});

const address = EntityAddress.make({
  entityType: EntityType.EntityType.make('MathEntity'),
  entityId: EntityId.make('entity-1'),
  shardId: ShardId.make('default', 3),
});

const requestEnvelope = Envelope.makeRequest({
  requestId,
  address,
  tag: 'Ping',
  payload: { value: 'hello' },
  headers: Headers.empty,
});

const outgoing = new Message.OutgoingRequest({
  envelope: requestEnvelope,
  context: Context.empty(),
  lastReceivedReply: Option.none(),
  rpc: Ping,
  respond: () => Effect.void,
});

export const run = async () => {
  const parts = Snowflake.toParts(requestId);
  assert.strictEqual(parts.machineId, MachineId.make(7));
  assert.strictEqual(parts.sequence, 11);

  const encoded = await Effect.runPromise(Message.serializeRequest(outgoing));
  assert.strictEqual(encoded._tag, 'Request');
  assert.strictEqual(encoded.tag, 'Ping');
  assert.deepStrictEqual(encoded.payload, { value: 'hello' });

  const incomingLocal = await Effect.runPromise(Message.deserializeLocal(outgoing, encoded));
  assert.strictEqual(incomingLocal._tag, 'IncomingRequestLocal');
  assert.strictEqual(incomingLocal.envelope.tag, 'Ping');
  assert.strictEqual(incomingLocal.envelope.payload.value, 'hello');

  const projectedLocal = Message.incomingLocalFromOutgoing(outgoing);
  assert.strictEqual(projectedLocal._tag, 'IncomingRequestLocal');
  assert.strictEqual(projectedLocal.envelope.address.entityId, EntityId.make('entity-1'));

  const primaryKey = Envelope.primaryKey(requestEnvelope);
  assert.strictEqual(primaryKey, null);

  const primaryKeyByAddress = Envelope.primaryKeyByAddress({
    address,
    tag: 'Ping',
    id: requestId.toString(),
  });
  assert.ok(primaryKeyByAddress.includes('MathEntity/entity-1/Ping'));

  return 'PASS: Snowflake + Envelope + Message request serialization/deserialization round-trip';
};
