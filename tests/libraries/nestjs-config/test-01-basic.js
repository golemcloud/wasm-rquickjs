import assert from 'assert';
import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';

export const run = () => {
  const service = new ConfigService({
    app: {
      name: 'catalog',
      retries: {
        max: 3,
      },
    },
    feature: {
      enabled: true,
    },
  });

  assert.strictEqual(service.get('app.name'), 'catalog');
  assert.strictEqual(service.get('app.retries.max'), 3);
  assert.strictEqual(service.get('feature.enabled'), true);
  assert.strictEqual(service.get('missing'), undefined);
  assert.strictEqual(service.get('missing', 'fallback'), 'fallback');

  return 'PASS: ConfigService.get resolves nested values and defaults';
};
