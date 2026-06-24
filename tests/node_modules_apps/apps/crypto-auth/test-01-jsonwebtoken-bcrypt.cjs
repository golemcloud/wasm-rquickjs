const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.run = () => {
  const token = jwt.sign({ sub: 'user-1', role: 'admin' }, 'secret', { algorithm: 'HS256', expiresIn: '1h' });
  const payload = jwt.verify(token, 'secret', { algorithms: ['HS256'] });
  assert.strictEqual(payload.sub, 'user-1');
  assert.strictEqual(payload.role, 'admin');

  const hash = bcrypt.hashSync('password', 4);
  assert.strictEqual(bcrypt.compareSync('password', hash), true);
  assert.strictEqual(bcrypt.compareSync('wrong', hash), false);
  return 'PASS: jsonwebtoken and bcryptjs execute from installed CommonJS packages';
};
