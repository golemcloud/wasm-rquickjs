import assert from 'assert';
import neo4j from 'neo4j-driver';

export const run = async () => {
  const driver = neo4j.driver(
    'bolt://localhost:17687',
    neo4j.auth.basic('neo4j', 'testpassword123')
  );

  assert.ok(driver);
  const session = driver.session({ database: 'neo4j' });
  assert.ok(session);

  await session.close();
  await driver.close();

  return 'PASS: driver and session can be created without immediate network I/O';
};
