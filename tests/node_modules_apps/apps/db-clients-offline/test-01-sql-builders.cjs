const assert = require('node:assert');
const knex = require('knex');

exports.run = () => {
  const db = knex({ client: 'pg' });
  const query = db('users').select('id', 'name').where({ active: true }).orderBy('id').toSQL();
  assert.strictEqual(query.sql, 'select "id", "name" from "users" where "active" = ? order by "id" asc');
  assert.deepStrictEqual(query.bindings, [true]);
  const insert = db('users').insert({ name: 'Alice' }).returning('id').toSQL();
  assert.match(insert.sql, /insert into "users"/);
  return 'PASS: knex query builder executes offline from installed node_modules';
};
