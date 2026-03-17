const ASYNC_CONTEXT_KEY = '__genkit_AsyncContext';
const TELEMETRY_PROVIDER_KEY = '__GENKIT_TELEMETRY_PROVIDER';

class TestAsyncContext {
  constructor() {
    this.stores = new Map();
  }

  getStore(key) {
    return this.stores.get(key);
  }

  run(key, store, callback) {
    const hasPrevious = this.stores.has(key);
    const previous = this.stores.get(key);
    this.stores.set(key, store);

    const restore = () => {
      if (hasPrevious) {
        this.stores.set(key, previous);
      } else {
        this.stores.delete(key);
      }
    };

    try {
      const result = callback();
      if (result && typeof result.then === 'function') {
        return result.finally(restore);
      }
      restore();
      return result;
    } catch (err) {
      restore();
      throw err;
    }
  }
}

if (!globalThis[ASYNC_CONTEXT_KEY]) {
  globalThis[ASYNC_CONTEXT_KEY] = new TestAsyncContext();
}

if (!globalThis[TELEMETRY_PROVIDER_KEY]) {
  globalThis[TELEMETRY_PROVIDER_KEY] = {
    enableTelemetry: async () => {},
    flushTracing: async () => {},
  };
}
