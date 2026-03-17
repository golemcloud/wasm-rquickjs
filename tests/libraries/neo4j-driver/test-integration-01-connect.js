import assert from 'assert';
import neo4j from 'neo4j-driver';

export const run = async () => {
  const driver = neo4j.driver(
    'bolt://localhost:17687',
    neo4j.auth.basic('neo4j', 'testpassword123')
  );

  try {
    await driver.verifyConnectivity();
    const info = await driver.getServerInfo();
    assert.ok(info.address);
    return 'PASS: verifyConnectivity and getServerInfo work against Docker Neo4j';
  } finally {
    await driver.close();
  }
};
