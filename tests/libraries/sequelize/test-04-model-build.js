import assert from 'assert';
import SequelizePkg from 'sequelize';

const { Sequelize, DataTypes } = SequelizePkg;

const makeSequelize = () =>
  new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    dialectModule: { Database: function Database() {} },
  });

export const run = () => {
  const sequelize = makeSequelize();

  const User = sequelize.define('User', {
    name: DataTypes.STRING,
    age: DataTypes.INTEGER,
  });

  const user = User.build({ name: 'Ada', age: 20 }, { isNewRecord: false, raw: true });
  assert.strictEqual(user.get('name'), 'Ada');
  assert.strictEqual(user.previous('age'), 20);

  user.set('age', 21);
  assert.strictEqual(user.get('age'), 21);
  assert.strictEqual(user.changed('age'), true);
  assert.strictEqual(user.previous('age'), 20);

  const plain = user.toJSON();
  assert.strictEqual(plain.name, 'Ada');
  assert.strictEqual(plain.age, 21);

  return 'PASS: Model.build supports in-memory instance state and change tracking';
};
