import assert from 'assert';
import SequelizePkg from 'sequelize';

const { Sequelize, Transaction, TableHints, IndexHints, version } = SequelizePkg;

const makeSequelize = () =>
  new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    dialectModule: { Database: function Database() {} },
  });

export const run = () => {
  const sequelize = makeSequelize();

  sequelize.addHook('beforeDefine', 'named-before-define', () => {});
  assert.strictEqual(sequelize.hasHook('beforeDefine'), true);

  sequelize.removeHook('beforeDefine', 'named-before-define');
  assert.strictEqual(sequelize.hasHook('beforeDefine'), false);

  assert.strictEqual(Transaction.ISOLATION_LEVELS.READ_COMMITTED, 'READ COMMITTED');
  assert.strictEqual(TableHints.NOLOCK, 'NOLOCK');
  assert.strictEqual(IndexHints.USE, 'USE');
  assert.match(version, /^6\./);

  return 'PASS: Hook registration and exported constants are available';
};
