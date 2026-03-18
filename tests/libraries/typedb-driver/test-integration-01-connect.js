import assert from 'assert';
import { SessionType, TransactionType, TypeDB } from 'typedb-driver';

const ADDRESS = '127.0.0.1:17290';
const DB_NAME = 'typedb_driver_int_connect';

export const run = async () => {
  const driver = await TypeDB.coreDriver(ADDRESS);

  try {
    assert.strictEqual(driver.isOpen(), true);

    if (await driver.databases.contains(DB_NAME)) {
      const existing = await driver.databases.get(DB_NAME);
      await existing.delete();
    }

    await driver.databases.create(DB_NAME);
    assert.strictEqual(await driver.databases.contains(DB_NAME), true);

    const db = await driver.databases.get(DB_NAME);
    assert.strictEqual(db.name, DB_NAME);

    const all = await driver.databases.all();
    assert.ok(all.some((entry) => entry.name === DB_NAME));

    const session = await driver.session(DB_NAME, SessionType.DATA);
    const tx = await session.transaction(TransactionType.READ);
    assert.strictEqual(tx.isOpen(), true);
    await tx.close();
    await session.close();

    return 'PASS: coreDriver connects and can create/list databases and open a transaction';
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
