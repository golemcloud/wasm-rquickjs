import assert from 'assert';
import {
  getOptionsToken,
  getStorageToken,
  InjectThrottlerOptions,
  InjectThrottlerStorage,
} from '@nestjs/throttler';

class Consumer {
  constructor(options, storage) {
    this.options = options;
    this.storage = storage;
  }
}

export const run = () => {
  const optionsToken = getOptionsToken();
  const storageToken = getStorageToken();

  assert.strictEqual(typeof optionsToken, 'string');
  assert.strictEqual(typeof storageToken, 'symbol');
  assert.notStrictEqual(optionsToken, storageToken);

  const optionsDecorator = InjectThrottlerOptions();
  const storageDecorator = InjectThrottlerStorage();

  assert.strictEqual(typeof optionsDecorator, 'function');
  assert.strictEqual(typeof storageDecorator, 'function');

  return 'PASS: DI token helpers and injection decorators are available';
};
