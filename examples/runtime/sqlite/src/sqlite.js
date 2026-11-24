import { DatabaseSync, serializeDatabaseSync, restoreDatabaseSync, isAutocommitDatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import assert from 'node:assert/strict';

let tmpCounter = 0;

export function testChangesetInputDetachedInCallback() {
  const source = new DatabaseSync(':memory:');
  const target = new DatabaseSync(':memory:');
  try {
    const schema = 'CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT)';
    source.exec(schema);
    target.exec(schema);
    const session = source.createSession();
    const insert = source.prepare('INSERT INTO items VALUES (?, ?)');
    const value = 'changeset-value-'.repeat(32);
    for (let i = 0; i < 1000; i++) insert.run(i, value);
    const changeset = session.changeset();
    let calls = 0;
    const applied = target.applyChangeset(changeset, {
      filter() {
        calls++;
        const transferred = changeset.buffer.transfer();
        new Uint8Array(transferred).fill(255);
        return true;
      },
    });
    const rows = target.prepare('SELECT value FROM items ORDER BY id').all();
    return applied && calls === 1 && changeset.byteLength === 0 &&
      rows.length === 1000 && rows.every(row => row.value === value);
  } finally {
    source.close();
    target.close();
  }
}

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

export function testPrepareOptions() {
  const db = new DatabaseSync(':memory:', {
    readBigInts: true,
    returnArrays: true,
    allowBareNamedParameters: false,
    allowUnknownNamedParameters: true,
  });
  try {
    const keys = ['returnArrays', 'readBigInts', 'allowBareNamedParameters', 'allowUnknownNamedParameters'];
    for (const key of keys) {
      for (const value of [null, 'true', 1, {}]) {
        assert.throws(() => db.prepare('SELECT 7', { [key]: value }), {
          name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE',
          message: `The "options.${key}" argument must be a boolean.`,
        });
      }
    }
    for (const options of [null, 0, 'options', false]) {
      assert.throws(() => db.prepare('SELECT 7', options), {
        name: 'TypeError', code: 'ERR_INVALID_ARG_TYPE',
        message: 'The "options" argument must be an object.',
      });
    }

    const calls = [];
    const options = {};
    for (const key of keys) {
      Object.defineProperty(options, key, {
        get() { calls.push(key); return undefined; },
      });
    }
    assert.deepEqual(db.prepare("SELECT 7 AS n, 'pear' AS label", options).get(), [7n, 'pear']);
    assert.deepEqual(calls, keys);
    for (let i = 0; i < keys.length - 1; i++) {
      const options = {
        [keys[i]]: null,
        get [keys[i + 1]]() { throw new Error('later option must not be read'); },
      };
      assert.throws(() => db.prepare('SELECT 7', options), {
        code: 'ERR_INVALID_ARG_TYPE',
        message: `The "options.${keys[i]}" argument must be a boolean.`,
      });
    }
    const sentinel = new Error('option getter');
    assert.throws(() => db.prepare('SELECT 7', {
      get readBigInts() { throw sentinel; },
    }), error => error === sentinel);
    const unread = { get returnArrays() { throw sentinel; } };
    assert.throws(() => db.prepare(null, unread), {
      code: 'ERR_INVALID_ARG_TYPE', message: /The "sql" argument must be a string/,
    });

    for (const options of [undefined, {}, [], () => {}, { readBigInts: undefined, returnArrays: undefined }]) {
      assert.deepEqual(db.prepare("SELECT 7 AS n, 'pear' AS label", options).get(), [7n, 'pear']);
    }
    const query = db.prepare("SELECT 7 AS n, 'pear' AS label", Object.create({
      readBigInts: false, returnArrays: false,
    }));
    assert.deepEqual(query.get(), { __proto__: null, n: 7, label: 'pear' });
    query.setReadBigInts(true);
    query.setReturnArrays(true);
    assert.deepEqual(query.get(), [7n, 'pear']);

    const sql = 'SELECT $left AS x, $right AS y';
    assert.deepEqual(db.prepare(sql).get({ left: 13n, right: 29n }), [null, null]);
    const named = db.prepare(sql, Object.create({ allowBareNamedParameters: true }));
    assert.deepEqual(named.get({ left: 13n, right: 29n, extra: 41n }), [13n, 29n]);
    const strict = db.prepare(sql, {
      allowBareNamedParameters: true, allowUnknownNamedParameters: false,
    });
    assert.throws(() => strict.get({ left: 13n, right: 29n, extra: 41n }), { code: 'ERR_INVALID_STATE' });
    strict.setAllowUnknownNamedParameters(true);
    assert.deepEqual(strict.get({ left: 13n, right: 29n, extra: 41n }), [13n, 29n]);
    named.setAllowBareNamedParameters(false);
    assert.deepEqual(named.get({ left: 13n, right: 29n }), [null, null]);
    assert.deepEqual(named.get({ $left: 13n, $right: 29n }), [13n, 29n]);
    for (const value of [undefined, null]) {
      const closing = new DatabaseSync(':memory:');
      assert.throws(() => closing.prepare('SELECT 7', {
        get returnArrays() { closing.close(); return value; },
      }), value === undefined ? {
        code: 'ERR_INVALID_STATE', message: 'database is not open',
      } : {
        code: 'ERR_INVALID_ARG_TYPE',
        message: 'The "options.returnArrays" argument must be a boolean.',
      });
    }
    db.close();
    assert.throws(() => db.prepare(null, unread), {
      code: 'ERR_INVALID_STATE', message: 'database is not open',
    });
  } finally {
    if (db.isOpen) db.close();
  }
  return true;
}

export function testTransactionState() {
  const db = new DatabaseSync(':memory:', { open: false });
  const closed = { code: 'ERR_INVALID_STATE', message: 'database is not open' };
  assert.throws(() => db.isTransaction, closed);
  try {
    db.open();
    assert.equal(db.isTransaction, false);
    db.exec('CREATE TABLE values_test (n INTEGER)');
    db.exec('BEGIN; INSERT INTO values_test VALUES (13)');
    assert.equal(db.isTransaction, true);
    db.exec('COMMIT');
    assert.equal(db.isTransaction, false);
    db.exec('BEGIN; INSERT INTO values_test VALUES (29)');
    assert.equal(db.isTransaction, true);
    db.exec('ROLLBACK');
    assert.equal(db.isTransaction, false);
    assert.deepEqual(db.prepare('SELECT n FROM values_test').all(), [{ __proto__: null, n: 13 }]);
    db.close();
    assert.throws(() => db.isTransaction, closed);
    db.open();
    assert.equal(db.isTransaction, false);
  } finally {
    if (db.isOpen) db.close();
  }
  return true;
}

export function testNumberBinding() {
  const db = new DatabaseSync(':memory:');
  try {
    for (const readBigInts of [true, false]) {
      const query = db.prepare('SELECT $n AS n, typeof($n) AS kind, $b AS b, typeof($b) AS bigint_kind', { readBigInts });
      for (const n of [13, -7, 2 ** 40 + 1, Number.MAX_SAFE_INTEGER, 1.25, Infinity, -Infinity]) {
        const expected = { __proto__: null, n, kind: 'real', b: readBigInts ? 29n : 29, bigint_kind: 'integer' };
        assert.deepEqual(query.get({ n, b: 29n }), expected);
        assert.deepEqual(query.all({ n, b: 29n }), [expected]);
        assert.deepEqual([...query.iterate({ n, b: 29n })], [expected]);
      }
      assert.deepEqual(db.prepare('SELECT ? AS n, typeof(?) AS kind', { readBigInts }).get(NaN, NaN), {
        __proto__: null, n: null, kind: 'null',
      });
    }
    db.exec('CREATE TABLE affinity_test (i INTEGER, r REAL, untyped)');
    const insert = db.prepare('INSERT INTO affinity_test VALUES (?, ?, ?)');
    insert.run(13, 29n, -7);
    assert.deepEqual(db.prepare('SELECT i, r, untyped, typeof(untyped) AS kind FROM affinity_test', {
      readBigInts: true,
    }).get(), { __proto__: null, i: 13n, r: 29, untyped: -7, kind: 'real' });
    assert.deepEqual(db.prepare('SELECT ? AS n, typeof(?) AS kind', {
      readBigInts: true,
    }).get(-0, -0), { __proto__: null, n: -0, kind: 'real' });
  } finally {
    db.close();
  }
  return true;
}
