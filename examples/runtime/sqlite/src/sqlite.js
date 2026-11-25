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

export function testStatementLifetime() {
  const db = new DatabaseSync(':memory:');
  try {
    assert.throws(() => db.prepare('SELECT missing FROM absent'), { code: 'ERR_SQLITE_ERROR' });
    db.exec('CREATE TABLE entries (n); INSERT INTO entries VALUES (13), (29), (41)');
    const query = db.prepare('SELECT n FROM entries ORDER BY n');
    const iterator = query.iterate();
    assert.deepEqual(iterator.next(), {
      __proto__: null, done: false, value: { __proto__: null, n: 13 },
    });
    query.get();
    assert.throws(() => iterator.next(), { code: 'ERR_INVALID_STATE', message: 'iterator was invalidated' });
    const second = query.iterate();
    assert.equal(second.next().value.n, 13);
    assert.deepEqual(second.return(), { __proto__: null, done: true, value: null });
    assert.deepEqual(second.next(), { __proto__: null, done: true, value: null });
    assert.deepEqual(query.all().map(row => row.n), [13, 29, 41]);
    assert.equal(query.close(), undefined);
    const finalized = { code: 'ERR_INVALID_STATE', message: 'statement has been finalized' };
    for (const action of [() => query.get(), () => query.sourceSQL, () => query.expandedSQL,
      () => query.close(), () => query.setReadBigInts(false), () => second.next()]) {
      assert.throws(action, finalized);
    }
    query[Symbol.dispose]();
    const beforeClose = db.prepare('SELECT 7 AS n');
    db.close();
    assert.throws(() => beforeClose.get(), finalized);
    db.open();
    assert.throws(() => beforeClose.get(), finalized);
    assert.equal(db.prepare('SELECT 11 AS n').get().n, 11);
  } finally {
    if (db.isOpen) db.close();
  }
  return true;
}

export function testStatementStatistics() {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE entries (id INTEGER PRIMARY KEY, value TEXT); INSERT INTO entries VALUES (13, \'pear\'), (29, \'plum\'), (41, \'pear\')');
    const scan = db.prepare('SELECT * FROM entries WHERE value = ?');
    const indexed = db.prepare('SELECT * FROM entries WHERE id = ?');
    assert.equal(scan.stat('run'), 0);
    assert.equal(scan.stat('vmStep'), 0);
    assert.deepEqual(scan.all('pear').map(row => row.id), [13, 41]);
    assert.equal(scan.stat('run'), 1);
    assert.ok(scan.stat('vmStep') > 0);
    assert.ok(scan.stat('fullscanStep') > 0);
    assert.equal(indexed.get(29).value, 'plum');
    assert.equal(indexed.stat('fullscanStep'), 0);
    const memory = scan.stat('memused');
    assert.ok(memory > 0);
    const steps = scan.stat('vmStep');
    assert.equal(scan.stat('vmStep'), steps);
    scan.resetStats();
    assert.equal(scan.stat('run'), 0);
    assert.equal(scan.stat('vmStep'), 0);
    assert.equal(scan.stat('memused'), memory);
    scan.all('plum');
    assert.equal(scan.stat('run'), 1);
    assert.throws(() => scan.stat(1), { code: 'ERR_INVALID_ARG_TYPE' });
    assert.throws(() => scan.stat('unknown'), { code: 'ERR_INVALID_ARG_VALUE' });
  } finally {
    db.close();
  }
  return true;
}

export function testStatementRecovery() {
  const db = new DatabaseSync(':memory:');
  const source = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE items (old INTEGER); INSERT INTO items VALUES (13), (29)');
    source.exec("CREATE TABLE items (replacement INTEGER, label TEXT); INSERT INTO items VALUES (41, 'pear'), (53, 'plum')");
    const image = serializeDatabaseSync(source);
    db.function('twice', n => n * 2);
    const query = db.prepare('SELECT * FROM items WHERE $pick IS NOT NULL ORDER BY 1', {
      readBigInts: true, returnArrays: true, allowBareNamedParameters: false,
      allowUnknownNamedParameters: true,
    });
    assert.deepEqual(query.all({ $pick: 1, ignored: 2 }), [[13n], [29n]]);
    const stale = query.iterate({ $pick: 1 });
    assert.deepEqual(stale.next().value, [13n]);
    const cursor = query.iterate({ $pick: 1 });
    assert.deepEqual(cursor.next().value, [13n]);
    stale.return();
    // Node 26 resets the shared statement even for an older iterator's return.
    // Recovery must nevertheless reject while the newer iterator remains live.
    assert.throws(() => restoreDatabaseSync(db, image), { code: 'ERR_INVALID_STATE' });
    assert.deepEqual(db.prepare('SELECT old FROM items ORDER BY old').all().map(row => row.old), [13, 29]);
    assert.deepEqual(cursor.next().value, [13n]);
    assert.throws(() => restoreDatabaseSync(db, image), { code: 'ERR_INVALID_STATE' });
    assert.deepEqual(cursor.next().value, [29n]);
    assert.deepEqual(db.prepare('SELECT old FROM items ORDER BY old').all().map(row => row.old), [13, 29]);
    cursor.return();
    restoreDatabaseSync(db, image);
    assert.equal(db.isOpen, true);
    assert.deepEqual(query.all({ $pick: 1, ignored: 2 }), [[41n, 'pear'], [53n, 'plum']]);
    assert.equal(query.get({ pick: 1 }), undefined);
    query.setAllowUnknownNamedParameters(false);
    assert.throws(() => query.get({ pick: 1 }), { code: 'ERR_INVALID_STATE' });
    query.setReturnArrays(false);
    assert.deepEqual(query.get({ $pick: 1 }), { __proto__: null, replacement: 41n, label: 'pear' });
    assert.equal(db.prepare('SELECT twice(replacement) AS n FROM items ORDER BY replacement').get().n, 82);
    const completedQuery = db.prepare('SELECT replacement FROM items ORDER BY replacement');
    const older = completedQuery.iterate();
    assert.equal(older.next().value.replacement, 41);
    assert.deepEqual([...completedQuery.iterate()].map(row => row.replacement), [41, 53]);
    older.return();
    // A stale return must not resurrect a cursor after the newer one drained.
    restoreDatabaseSync(db, image);
    // The attempted image must differ from live state, so rejection alone
    // cannot hide a recovery that mutated the database before throwing.
    db.exec('UPDATE items SET replacement = replacement + 100');
    let calls = 0;
    db.function('try_restore', () => {
      calls++;
      assert.throws(() => restoreDatabaseSync(db, image), { code: 'ERR_INVALID_STATE' });
      return 7;
    });
    assert.deepEqual(db.prepare('SELECT replacement, try_restore() AS n FROM items ORDER BY replacement').all()
      .map(row => [row.replacement, row.n]), [[141, 7], [153, 7]]);
    assert.equal(calls, 2);
    assert.deepEqual(db.prepare('SELECT replacement FROM items ORDER BY replacement').all()
      .map(row => row.replacement), [141, 153]);
  } finally {
    db.close();
    source.close();
  }
  return true;
}

export function testStatementDeserialize() {
  const db = new DatabaseSync(':memory:');
  const source = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE items (n); INSERT INTO items VALUES (13), (29)');
    source.exec('CREATE TABLE items (n); INSERT INTO items VALUES (41), (53)');
    const image = serializeDatabaseSync(source);
    let byteLengthReads = 0;
    Object.defineProperty(image, 'byteLength', { get() {
      byteLengthReads++;
      throw new Error('deserialize must read the intrinsic byte length');
    } });
    const idle = db.prepare('SELECT n FROM items');
    const cursor = db.prepare('SELECT n FROM items').iterate();
    assert.equal(cursor.next().value.n, 13);
    db.deserialize(image);
    assert.equal(byteLengthReads, 0);
    const finalized = { code: 'ERR_INVALID_STATE', message: 'statement has been finalized' };
    assert.throws(() => idle.get(), finalized);
    assert.throws(() => cursor.next(), finalized);
    assert.deepEqual(db.prepare('SELECT n FROM items ORDER BY n').all().map(row => row.n), [41, 53]);
    const beforeFailure = db.prepare('SELECT 17 AS n');
    assert.throws(() => db.deserialize(image, { dbName: 'missing' }), { code: 'ERR_SQLITE_ERROR' });
    assert.throws(() => beforeFailure.get(), finalized);
    let running;
    const independent = db.prepare('SELECT 19 AS n');
    db.function('reenter', () => {
      assert.throws(() => running.get(), { code: 'ERR_INVALID_STATE' });
      assert.throws(() => running.close(), { code: 'ERR_INVALID_STATE' });
      assert.throws(() => db.deserialize(image), { code: 'ERR_INVALID_STATE' });
      assert.throws(() => db.close(), { code: 'ERR_INVALID_STATE' });
      return independent.get().n;
    });
    running = db.prepare('SELECT reenter() AS n');
    assert.equal(running.get().n, 19);
    const sentinel = new Error('loop body');
    const live = independent.iterate();
    assert.throws(() => { for (const row of live) { assert.equal(row.n, 19); throw sentinel; } }, error => error === sentinel);
    assert.deepEqual(live.next(), { __proto__: null, done: true, value: null });
    assert.equal(independent.get().n, 19);
  } finally {
    db.close();
    source.close();
  }
  return true;
}
