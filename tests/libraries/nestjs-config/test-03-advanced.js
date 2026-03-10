import assert from 'assert';
import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';

export const run = () => {
  const service = new ConfigService({
    app: {
      retries: 2,
    },
  });

  const events = [];
  const subscription = service.changes$.subscribe((event) => {
    events.push(event);
  });

  service.set('app.retries', 5);
  service.set('app.mode', 'strict');

  subscription.unsubscribe();

  assert.strictEqual(service.get('app.retries'), 5);
  assert.strictEqual(service.get('app.mode'), 'strict');
  assert.strictEqual(events.length, 2);
  assert.strictEqual(events[0].path, 'app.retries');
  assert.strictEqual(events[0].oldValue, 2);
  assert.strictEqual(events[0].newValue, 5);
  assert.strictEqual(events[1].path, 'app.mode');
  assert.strictEqual(events[1].oldValue, undefined);
  assert.strictEqual(events[1].newValue, 'strict');

  return 'PASS: ConfigService.set updates values and emits change events';
};
