// JavaScript implementation of the exported `counter` resource (see `wit/world.wit`).
//
// The synchronous WIT methods (`increment`, `get`, `staticZero`) return values directly: on the
// Preview 3 path a synchronous exported resource method whose JavaScript returns a Promise traps
// with an actionable message, because it is driven by `block_on` and must not suspend. Only the
// `async func` method (`incrementAsync`) returns a Promise.
const constructorRejection = new Error('constructor checkpoint');
let constructorCheckpointCount = 0;
let unexpectedTimerCallbacks = 0;
let stashedCounter;
process.on('unhandledRejection', (reason) => {
  if (reason === constructorRejection) constructorCheckpointCount += 1;
});

class Counter {
  constructor(initial) {
    this.value = initial;
    Promise.reject(constructorRejection);
    // Scheduling work must not keep a synchronous component-model constructor running.
    // The next async entry cancels this unreferenced timer at the normal idle boundary.
    setInterval(() => {
      unexpectedTimerCallbacks += 1;
    }, 60_000).unref();
    this.timerState = { ran: false };
    this.timer = new Promise(resolve => {
      setTimeout(() => {
        this.timerState.ran = true;
        resolve();
      }, 0);
    });
    const canceled = setTimeout(() => {
      unexpectedTimerCallbacks += 1;
    }, 0);
    clearTimeout(canceled);
  }

  increment(by) {
    if (this.timerState.ran) throw new Error('constructor timer ran during synchronous calls');
    this.value += by;
    return this.value;
  }

  get() {
    if (unexpectedTimerCallbacks !== 0) throw new Error('canceled or unreferenced timer ran');
    return this.value;
  }

  addOther(other) {
    return this.value + other.value;
  }

  static staticZero() {
    return 0;
  }

  static checkpointCount() {
    return constructorCheckpointCount;
  }

  static identity(value) {
    return value;
  }

  static async identityAsync(value) {
    await value.timer;
    if (!value.timerState.ran) throw new Error('async entry did not drive the constructor timer');
    return value;
  }

  static alias(value) {
    return value;
  }

  static duplicate(value) {
    return [value, value];
  }

  static stash(value) {
    Object.freeze(value);
    stashedCounter = value;
  }

  static stashAndFail(value) {
    Object.freeze(value);
    stashedCounter = value;
    throw "expected failure";
  }

  static async stashAndFailAsync(value) {
    Object.freeze(value);
    stashedCounter = value;
    await Promise.resolve();
    throw "expected async failure";
  }

  static take() {
    const value = stashedCounter;
    stashedCounter = undefined;
    return value;
  }

  static resourceCount() {
    return Object.keys(globalThis.__wasm_rquickjs_resources).length;
  }

  async incrementAsync(by, other) {
    const otherValue = other.value;
    // A genuine async step to prove the async method path awaits the JS Promise.
    await Promise.resolve();
    this.value += by;
    return this.value + otherValue;
  }
}

export const api = {
  Counter,
};
