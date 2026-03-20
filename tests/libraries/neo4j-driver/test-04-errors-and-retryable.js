import assert from 'assert';
import neo4j from 'neo4j-driver';

export const run = () => {
  const retryable = new neo4j.Neo4jError(
    'temporary outage',
    'Neo.TransientError.General.DatabaseUnavailable'
  );
  assert.strictEqual(neo4j.isRetriableError(retryable), true);

  const fatal = new neo4j.Neo4jError(
    'syntax issue',
    'Neo.ClientError.Statement.SyntaxError'
  );
  assert.strictEqual(neo4j.isRetriableError(fatal), false);

  return 'PASS: Neo4j error classification matches retryable semantics';
};
