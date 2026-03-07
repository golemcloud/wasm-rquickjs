import assert from 'assert';
import { EntitySchema } from 'typeorm/index.mjs';

export const run = () => {
  const UserSchema = new EntitySchema({
    name: 'User',
    tableName: 'users',
    columns: {
      id: { type: Number, primary: true, generated: true },
      email: { type: String, unique: true },
      age: { type: Number, nullable: true },
    },
    indices: [
      {
        name: 'idx_users_email',
        columns: ['email'],
        unique: true,
      },
    ],
  });

  assert.strictEqual(UserSchema.options.name, 'User');
  assert.strictEqual(UserSchema.options.tableName, 'users');
  assert.strictEqual(UserSchema.options.columns.id.generated, true);
  assert.strictEqual(UserSchema.options.columns.email.unique, true);
  assert.strictEqual(UserSchema.options.indices[0].name, 'idx_users_email');

  return 'PASS: EntitySchema captures table, column, and index definitions';
};
