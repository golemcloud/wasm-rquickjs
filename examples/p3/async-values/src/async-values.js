// Returns a component `future<u32>` to the host. Returning a value (or a promise of a value) from
// the JS function is lowered into the component future.
export async function runFuture() {
  // Yield to the microtask queue first to prove the value is resolved asynchronously.
  await Promise.resolve();
  return 42;
}

const checkpointReason = new Error('raw future checkpoint');
let checkpointCount = 0;
process.on('unhandledRejection', (reason) => {
  if (reason === checkpointReason) checkpointCount += 1;
});

// The unrelated rejection must be reported at the raw future export boundary,
// before the host can make its next call into JavaScript.
export async function runCheckpointFuture() {
  Promise.reject(checkpointReason);
  return 7;
}

export function readCheckpointCount() {
  return checkpointCount;
}

// Returns a component `stream<u8>` to the host. Returning an async-iterable (here an async
// generator) drives the component stream one item at a time.
export async function runStream() {
  async function* gen() {
    for (let i = 1; i <= 5; i++) {
      await Promise.resolve();
      yield i;
    }
  }
  return gen();
}

// Returns future/stream readers nested in a record. The wrapper must return the record to the host
// before its writer tasks encounter backpressure on those readers.
export async function runNested() {
  async function* stdout() {
    for (const byte of [6, 7, 8]) {
      await new Promise((resolve) => setTimeout(resolve, 1));
      yield byte;
    }
  }

  async function* stderr() {
    for (const byte of [9, 10]) {
      await Promise.resolve();
      yield byte;
    }
  }

  await Promise.resolve();
  return {
    label: 'nested-ok',
    futureValue: Promise.resolve(99),
    stdout: stdout(),
    stderr: stderr(),
  };
}

export async function runNestedError() {
  throw 'nested-error';
}

// Receives a component `future<u32>` from the host, exposed to JS as a `Promise<u32>`.
export async function takeFuture(f) {
  const v = await f;
  return v + 1;
}

// Receives a component `stream<u8>` from the host, exposed to JS as an async-iterable.
export async function takeStream(s) {
  let sum = 0;
  for await (const x of s) {
    sum += x;
  }
  return sum;
}
