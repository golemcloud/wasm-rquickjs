import assert from 'assert';
import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';

export const run = () => {
  const service = new ConfigService({
    app: {
      name: 'catalog',
      timeoutMs: 500,
    },
  });

  assert.strictEqual(service.getOrThrow('app.name'), 'catalog');
  assert.strictEqual(service.getOrThrow('app.timeoutMs'), 500);

  assert.throws(
    () => service.getOrThrow('app.missingKey'),
    (error) => {
      assert.ok(error instanceof TypeError);
      assert.ok(String(error.message).includes('app.missingKey'));
      return true;
    }
  );

  return 'PASS: ConfigService.getOrThrow returns values and throws for missing paths';
};
