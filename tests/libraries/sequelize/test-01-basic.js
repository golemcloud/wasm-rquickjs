import assert from 'assert';
import SequelizePkg from 'sequelize';

const { DataTypes } = SequelizePkg;

export const run = () => {
  const varchar = DataTypes.STRING(12);
  assert.strictEqual(varchar.toSql(), 'VARCHAR(12)');

  const integer = DataTypes.INTEGER();
  integer.validate(42);
  assert.throws(() => integer.validate('not-an-integer'), /valid integer/);

  const role = DataTypes.ENUM('admin', 'editor', 'viewer');
  role.validate('admin');
  assert.throws(() => role.validate('owner'), /valid choice/);

  return 'PASS: DataTypes validate values and render SQL types';
};
