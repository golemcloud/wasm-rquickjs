import assert from 'assert';
import 'reflect-metadata';
import { getConfigToken, registerAs } from '@nestjs/config';

export const run = () => {
  const databaseConfig = registerAs('database', () => ({
    host: 'localhost',
    port: 5432,
  }));

  const config = databaseConfig();
  assert.strictEqual(config.host, 'localhost');
  assert.strictEqual(config.port, 5432);

  assert.strictEqual(getConfigToken('database'), 'CONFIGURATION(database)');
  assert.strictEqual(databaseConfig.KEY, getConfigToken('database'));

  const provider = databaseConfig.asProvider();
  assert.strictEqual(typeof provider.useFactory, 'function');
  assert.ok(Array.isArray(provider.imports));
  assert.ok(Array.isArray(provider.inject));
  assert.strictEqual(provider.inject[0], getConfigToken('database'));
  assert.strictEqual(provider.useFactory(config), config);

  return 'PASS: registerAs produces keyed factories and provider metadata';
};
