import assert from 'assert';
import { InvalidRecordIdError, InvalidTableError, RecordId, Table } from 'surrealdb';

export const run = () => {
  assert.throws(() => new Table(123), InvalidTableError);
  assert.throws(() => new RecordId('person', undefined), InvalidRecordIdError);
  assert.throws(() => new RecordId('person', Symbol('bad-id')), InvalidRecordIdError);

  return 'PASS: constructor validation errors are raised for invalid table/record identifiers';
};
