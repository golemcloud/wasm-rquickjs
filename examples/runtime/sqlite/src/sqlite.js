import { DatabaseSync, serializeDatabaseSync, restoreDatabaseSync, isAutocommitDatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';

let tmpCounter = 0;
function tmpDb() {
  return `/test/sqlite-test-${Date.now()}-${tmpCounter++}.db`;
}

export function testMemoryRoundtrip() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT)');
  db.exec("INSERT INTO items (value) VALUES ('hello')");
  db.exec("INSERT INTO items (value) VALUES ('world')");

  const bytes = serializeDatabaseSync(db);
  if (!(bytes instanceof Uint8Array)) return false;
  if (bytes.length === 0) return false;

  const db2 = new DatabaseSync(':memory:');
  restoreDatabaseSync(db2, bytes);

  const rows = db2.prepare('SELECT value FROM items ORDER BY id').all();
  if (rows.length !== 2) return false;
  if (rows[0].value !== 'hello') return false;
  if (rows[1].value !== 'world') return false;

  db.close();
  db2.close();
  return true;
}

export function testFileRoundtrip() {
  const p1 = tmpDb();
  const db1 = new DatabaseSync(p1);
  db1.exec('CREATE TABLE data (k TEXT, v INTEGER)');
  db1.exec("INSERT INTO data VALUES ('a', 1)");
  db1.exec("INSERT INTO data VALUES ('b', 2)");

  const bytes = serializeDatabaseSync(db1);
  db1.close();

  const p2 = tmpDb();
  const db2 = new DatabaseSync(p2);
  restoreDatabaseSync(db2, bytes);

  const rows = db2.prepare('SELECT k, v FROM data ORDER BY k').all();
  db2.close();

  // Clean up
  try { fs.unlinkSync(p1); } catch (e) {}
  try { fs.unlinkSync(p2); } catch (e) {}

  if (rows.length !== 2) return false;
  if (rows[0].k !== 'a') return false;
  if (rows[1].v !== 2) return false;
  return true;
}

export function testUdfSurvivesRestore() {
  const db = new DatabaseSync(':memory:');
  db.function('triple', (x) => x * 3);
  db.exec('CREATE TABLE nums (n INTEGER)');
  db.exec('INSERT INTO nums VALUES (5)');

  const bytes = serializeDatabaseSync(db);

  const db2 = new DatabaseSync(':memory:');
  db2.function('triple', (x) => x * 3);
  restoreDatabaseSync(db2, bytes);

  const row = db2.prepare('SELECT triple(n) as result FROM nums').get();
  db2.close();
  db.close();

  return row.result === 15;
}

export function testConstructorOverwritten() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE config (key TEXT PRIMARY KEY, val TEXT)');
  db.exec("INSERT INTO config VALUES ('mode', 'production')");

  const bytes = serializeDatabaseSync(db);
  db.close();

  // Simulate constructor inserting defaults
  const db2 = new DatabaseSync(':memory:');
  db2.exec('CREATE TABLE config (key TEXT PRIMARY KEY, val TEXT)');
  db2.exec("INSERT INTO config VALUES ('mode', 'development')");

  restoreDatabaseSync(db2, bytes);

  const row = db2.prepare("SELECT val FROM config WHERE key = 'mode'").get();
  db2.close();

  return row.val === 'production';
}

export function testOpenTransactionDetected() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE t (x INTEGER)');
  db.exec('BEGIN');

  if (isAutocommitDatabaseSync(db) !== false) return false;

  // serialize still works (read-only operation)
  const bytes = serializeDatabaseSync(db);
  if (bytes.length === 0) return false;

  db.exec('ROLLBACK');
  if (isAutocommitDatabaseSync(db) !== true) return false;

  db.close();
  return true;
}

export function testReadOnlyRejected() {
  const p = tmpDb();
  const dbW = new DatabaseSync(p);
  dbW.exec('CREATE TABLE t (x INTEGER)');
  dbW.exec('INSERT INTO t VALUES (1)');
  const bytes = serializeDatabaseSync(dbW);
  dbW.close();

  const dbR = new DatabaseSync(p, { readOnly: true });
  let threw = false;
  try {
    restoreDatabaseSync(dbR, bytes);
  } catch (e) {
    threw = true;
  }
  dbR.close();

  try { fs.unlinkSync(p); } catch (e) {}
  return threw;
}

export function testWalModeSnapshot() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA journal_mode=WAL');
  db.exec('CREATE TABLE wal_test (id INTEGER PRIMARY KEY, data TEXT)');
  for (let i = 0; i < 100; i++) {
    db.exec(`INSERT INTO wal_test VALUES (${i}, 'data-${i}')`);
  }

  if (isAutocommitDatabaseSync(db) !== true) return false;

  const bytes = serializeDatabaseSync(db);

  const db2 = new DatabaseSync(':memory:');
  restoreDatabaseSync(db2, bytes);

  const count = db2.prepare('SELECT COUNT(*) as cnt FROM wal_test').get();
  db.close();
  db2.close();

  return count.cnt === 100;
}

export function testAutocommitTracking() {
  const db = new DatabaseSync(':memory:');
  if (isAutocommitDatabaseSync(db) !== true) return false;

  db.exec('CREATE TABLE t (x INTEGER)');
  db.exec('BEGIN');
  if (isAutocommitDatabaseSync(db) !== false) return false;

  db.exec('COMMIT');
  if (isAutocommitDatabaseSync(db) !== true) return false;

  db.close();
  return true;
}

export function testTypeValidation() {
  let threw1 = false;
  try { serializeDatabaseSync({}); } catch (e) { threw1 = true; }
  if (!threw1) return false;

  let threw2 = false;
  try { restoreDatabaseSync({}, new Uint8Array(0)); } catch (e) { threw2 = true; }
  if (!threw2) return false;

  let threw3 = false;
  try { isAutocommitDatabaseSync({}); } catch (e) { threw3 = true; }
  if (!threw3) return false;

  return true;
}
