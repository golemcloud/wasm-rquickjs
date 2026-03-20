import assert from 'assert';
import mysql from 'mysql2';

export const run = () => {
  assert.strictEqual(mysql.Types.JSON, 245);
  assert.strictEqual(mysql.Types.GEOMETRY, 255);

  assert.ok(mysql.Charsets.UTF8MB4_UNICODE_CI > 0);
  const encoding = mysql.CharsetToEncoding[mysql.Charsets.UTF8MB4_UNICODE_CI];
  assert.strictEqual(typeof encoding, 'string');
  assert.ok(encoding.length > 0);

  assert.strictEqual(typeof mysql.authPlugins.caching_sha2_password, 'function');
  assert.strictEqual(typeof mysql.authPlugins.mysql_native_password, 'function');

  return 'PASS: mysql2 constants, charset maps, and auth plugins are exposed';
};
