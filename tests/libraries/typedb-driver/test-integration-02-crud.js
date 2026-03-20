import assert from 'assert';
import { SessionType, TransactionType, TypeDB } from 'typedb-driver';

const ADDRESS = '127.0.0.1:17290';
const DB_NAME = 'typedb_driver_int_crud';

export const run = async () => {
  const driver = await TypeDB.coreDriver(ADDRESS);

  try {
    if (await driver.databases.contains(DB_NAME)) {
      const existing = await driver.databases.get(DB_NAME);
      await existing.delete();
    }
    await driver.databases.create(DB_NAME);

    const schemaSession = await driver.session(DB_NAME, SessionType.SCHEMA);
    const schemaTx = await schemaSession.transaction(TransactionType.WRITE);
    await schemaTx.query.define(`
define
  person sub entity,
    owns name;
  name sub attribute,
    value string;
`);
    await schemaTx.commit();
    await schemaSession.close();

    const writeSession = await driver.session(DB_NAME, SessionType.DATA);
    const writeTx = await writeSession.transaction(TransactionType.WRITE);
    await writeTx.query.insert('insert $p isa person, has name "Alice";').collect();
    await writeTx.query.insert('insert $p isa person, has name "Bob";').collect();
    await writeTx.commit();
    await writeSession.close();

    const readSession = await driver.session(DB_NAME, SessionType.DATA);
    const readTx = await readSession.transaction(TransactionType.READ);

    const rows = await readTx.query.get('match $p isa person, has name $n; get $n;').collect();
    const names = rows.map((row) => row.get('n').asAttribute().value).sort();
    assert.deepStrictEqual(names, ['Alice', 'Bob']);

    const countBeforeDelete = await readTx.query.getAggregate('match $p isa person; get $p; count;');
    assert.ok(countBeforeDelete);
    assert.strictEqual(countBeforeDelete.asLong(), 2);
    await readTx.close();
    await readSession.close();

    const deleteSession = await driver.session(DB_NAME, SessionType.DATA);
    const deleteTx = await deleteSession.transaction(TransactionType.WRITE);
    await deleteTx.query.delete('match $p isa person, has name "Alice"; delete $p isa person;');
    await deleteTx.commit();
    await deleteSession.close();

    const verifySession = await driver.session(DB_NAME, SessionType.DATA);
    const verifyTx = await verifySession.transaction(TransactionType.READ);
    const countAfterDelete = await verifyTx.query.getAggregate('match $p isa person; get $p; count;');
    assert.ok(countAfterDelete);
    assert.strictEqual(countAfterDelete.asLong(), 1);
    await verifyTx.close();
    await verifySession.close();

    return 'PASS: schema define, insert, read aggregate, and delete all work against TypeDB';
  } finally {
    try {
      if (await driver.databases.contains(DB_NAME)) {
        const db = await driver.databases.get(DB_NAME);
        await db.delete();
      }
    } finally {
      await driver.close();
    }
  }
};
