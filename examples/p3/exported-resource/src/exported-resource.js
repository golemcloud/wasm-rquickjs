// JavaScript implementation of the exported `counter` resource (see `wit/world.wit`).
//
// The synchronous WIT methods (`increment`, `get`, `staticZero`) return values directly: on the
// Preview 3 path a synchronous exported resource method whose JavaScript returns a Promise traps
// with an actionable message, because it is driven by `block_on` and must not suspend. Only the
// `async func` method (`incrementAsync`) returns a Promise.
const constructorRejection = new Error('constructor checkpoint');
let constructorCheckpointCount = 0;
let stashedCounter;
process.on('unhandledRejection', (reason) => {
  if (reason === constructorRejection) constructorCheckpointCount += 1;
});

class Counter {
  constructor(initial) {
    this.value = initial;
    Promise.reject(constructorRejection);
  }

  increment(by) {
    this.value += by;
    return this.value;
  }

  get() {
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
    await Promise.resolve();
    return value;
  }

  static alias(value) {
    return value;
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

  static take() {
    const value = stashedCounter;
    stashedCounter = undefined;
    return value;
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
