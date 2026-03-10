import assert from 'assert';
import 'reflect-metadata';
import { ConditionalModule, ConfigModule } from '@nestjs/config';

class DemoModule {}

export const run = async () => {
  const rootModule = await ConfigModule.forRoot({
    ignoreEnvFile: true,
    load: [() => ({ app: { mode: 'test' } })],
  });
  assert.strictEqual(rootModule.module, ConfigModule);

  const includeWhenTrue = await ConditionalModule.registerWhen(DemoModule, () => true, {
    timeout: 100,
    debug: false,
  });
  assert.strictEqual(includeWhenTrue.imports.length, 1);
  assert.strictEqual(includeWhenTrue.imports[0], DemoModule);

  process.env.NESTJS_CONFIG_INCLUDE_DEMO = 'false';
  const skipWhenFalse = await ConditionalModule.registerWhen(
    DemoModule,
    'NESTJS_CONFIG_INCLUDE_DEMO',
    {
      timeout: 100,
      debug: false,
    }
  );
  assert.strictEqual(skipWhenFalse.imports.length, 0);
  assert.strictEqual(skipWhenFalse.exports.length, 0);

  return 'PASS: ConditionalModule.registerWhen evaluates callbacks and env key conditions';
};
