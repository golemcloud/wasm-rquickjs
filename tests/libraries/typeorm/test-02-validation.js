import assert from 'assert';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  getMetadataArgsStorage,
} from 'typeorm/index.mjs';

export const run = () => {
  class MissingTypeEntity {}

  let sawColumnTypeError = false;
  try {
    Column()(MissingTypeEntity.prototype, 'value');
  } catch (error) {
    sawColumnTypeError = String(error?.message).includes('Column type for');
  }

  assert.strictEqual(sawColumnTypeError, true);

  class DecoratedUser {}

  Entity('decorated_users')(DecoratedUser);
  PrimaryGeneratedColumn()(DecoratedUser.prototype, 'id');
  Column({ type: 'varchar', length: 255 })(DecoratedUser.prototype, 'name');

  const storage = getMetadataArgsStorage();
  const tableMetadata = storage.tables.find((table) => table.target === DecoratedUser);
  const idColumn = storage.columns.find(
    (column) => column.target === DecoratedUser && column.propertyName === 'id',
  );
  const nameColumn = storage.columns.find(
    (column) => column.target === DecoratedUser && column.propertyName === 'name',
  );

  assert.ok(tableMetadata);
  assert.ok(idColumn);
  assert.ok(nameColumn);
  assert.strictEqual(nameColumn.options.type, 'varchar');

  return 'PASS: Decorators validate missing column types and register metadata';
};
