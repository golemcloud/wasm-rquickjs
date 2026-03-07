import assert from 'assert';
import mysql from 'mysql2';

const endPool = (pool) =>
  new Promise((resolve, reject) => {
    pool.end((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

const endPoolCluster = (cluster) =>
  new Promise((resolve, reject) => {
    cluster.end((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

export const run = async () => {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    database: 'testdb',
    waitForConnections: true,
    connectionLimit: 2,
  });

  assert.strictEqual(typeof pool.query, 'function');
  assert.strictEqual(typeof pool.execute, 'function');
  assert.strictEqual(typeof pool.getConnection, 'function');

  await endPool(pool);

  const cluster = mysql.createPoolCluster({
    removeNodeErrorCount: 1,
    restoreNodeTimeout: 1,
    defaultSelector: 'RR',
  });

  cluster.add('PRIMARY', {
    host: '127.0.0.1',
    user: 'root',
    database: 'testdb',
  });

  const namespace = cluster.of('PRIMARY');
  assert.strictEqual(typeof namespace.getConnection, 'function');

  await endPoolCluster(cluster);

  return 'PASS: pool and pool cluster lifecycle work without establishing connections';
};
