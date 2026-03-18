import assert from 'assert';
import { Concept, SessionType, TransactionType, TypeDB } from 'typedb-driver';

export const run = async () => {
  assert.strictEqual(TypeDB.DEFAULT_ADDRESS, '127.0.0.1:1729');
  assert.strictEqual(typeof TypeDB.coreDriver, 'function');
  assert.strictEqual(typeof TypeDB.cloudDriver, 'function');

  assert.ok(SessionType.DATA.isData());
  assert.ok(!SessionType.DATA.isSchema());
  assert.ok(SessionType.SCHEMA.isSchema());
  assert.ok(!SessionType.SCHEMA.isData());

  assert.ok(TransactionType.READ.isRead());
  assert.ok(!TransactionType.READ.isWrite());
  assert.ok(TransactionType.WRITE.isWrite());
  assert.ok(!TransactionType.WRITE.isRead());

  assert.strictEqual(Concept.ValueType.STRING.name().toLowerCase(), 'string');
  assert.strictEqual(Concept.ValueType.BOOLEAN.name().toLowerCase(), 'boolean');
  assert.strictEqual(Concept.ValueType.DATETIME.name().toLowerCase(), 'datetime');

  return 'PASS: exports, constants, and enum helpers are available';
};
