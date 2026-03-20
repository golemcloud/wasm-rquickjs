import assert from 'assert';
import neo4j from 'neo4j-driver';

export const run = async () => {
  const driver = neo4j.driver(
    'bolt://localhost:17687',
    neo4j.auth.basic('neo4j', 'testpassword123')
  );

  const id = `neo4j-driver-${Date.now()}`;

  try {
    await driver.executeQuery(
      'CREATE (n:WasmRquickjsNeo4jTest {id: $id, value: $value}) RETURN n.value AS value',
      { id, value: 'ok' }
    );

    const read = await driver.executeQuery(
      'MATCH (n:WasmRquickjsNeo4jTest {id: $id}) RETURN n.value AS value',
      { id }
    );

    assert.strictEqual(read.records.length, 1);
    assert.strictEqual(read.records[0].get('value'), 'ok');

    await driver.executeQuery(
      'MATCH (n:WasmRquickjsNeo4jTest {id: $id}) DELETE n',
      { id }
    );

    return 'PASS: create, read, and delete queries succeed via executeQuery';
  } finally {
    await driver.close();
  }
};
