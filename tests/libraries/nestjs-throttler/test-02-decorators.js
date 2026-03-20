import 'reflect-metadata';
import assert from 'assert';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

class ExampleController {
  list() {
    return 'ok';
  }
}

export const run = () => {
  Throttle({
    default: {
      limit: 5,
      ttl: 1_000,
      blockDuration: 2_000,
      getTracker: () => 'tracker-1',
      generateKey: () => 'key-1',
    },
  })(ExampleController);

  const listDescriptor = Object.getOwnPropertyDescriptor(ExampleController.prototype, 'list');
  SkipThrottle({ default: true })(ExampleController.prototype, 'list', listDescriptor);

  const classMetadataKeys = Reflect.getMetadataKeys(ExampleController);
  const methodMetadataKeys = Reflect.getMetadataKeys(ExampleController.prototype.list);

  const hasThrottleMetadata = classMetadataKeys.some((key) => String(key).includes('THROTTLER:LIMIT'));
  const hasSkipMetadata = methodMetadataKeys.some((key) => String(key).includes('THROTTLER:SKIP'));

  assert.ok(hasThrottleMetadata, 'expected @Throttle to define metadata keys');
  assert.ok(hasSkipMetadata, 'expected @SkipThrottle to define metadata keys');

  return 'PASS: Throttle and SkipThrottle decorators attach metadata';
};
