import assert from 'node:assert';
import { ClusterError, EntityAddress, EntityId, EntityType, RunnerAddress, ShardId, Snowflake } from '@effect/cluster';

const address = EntityAddress.make({
  entityType: EntityType.EntityType.make('TestEntity'),
  entityId: EntityId.make('entity-77'),
  shardId: ShardId.make('default', 77),
});

const runnerAddress = RunnerAddress.make('127.0.0.1', 9000);

export const run = () => {
  const notAssigned = new ClusterError.EntityNotAssignedToRunner({ address });
  assert.strictEqual(notAssigned._tag, 'EntityNotAssignedToRunner');
  assert.ok(ClusterError.EntityNotAssignedToRunner.is(notAssigned));

  const runnerUnavailable = new ClusterError.RunnerUnavailable({ address: runnerAddress });
  assert.strictEqual(runnerUnavailable._tag, 'RunnerUnavailable');
  assert.ok(ClusterError.RunnerUnavailable.is(runnerUnavailable));

  const mailboxFull = new ClusterError.MailboxFull({ address });
  assert.strictEqual(mailboxFull._tag, 'MailboxFull');
  assert.ok(ClusterError.MailboxFull.is(mailboxFull));

  const alreadyProcessing = new ClusterError.AlreadyProcessingMessage({
    envelopeId: Snowflake.Snowflake(999n),
    address,
  });
  assert.strictEqual(alreadyProcessing._tag, 'AlreadyProcessingMessage');
  assert.ok(ClusterError.AlreadyProcessingMessage.is(alreadyProcessing));

  return 'PASS: Cluster error constructors and type-guard helpers behave as documented';
};
