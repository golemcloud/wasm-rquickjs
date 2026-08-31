import * as observer from 'test:async-values/observer';

// Returns a component `future<u32>` to the host. Returning a value (or a promise of a value) from
// the JS function is lowered into the component future.
export async function runFuture() {
  // Yield to the microtask queue first to prove the value is resolved asynchronously.
  await Promise.resolve();
  return 42;
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

export async function inspectStreamCompletion(s) {
  const iterator = s[Symbol.asyncIterator]();
  const values = [];
  while (true) {
    const result = await iterator.next();
    if (result.done) {
      return `${values.join(',')}|${result.done}|${result.value === undefined}`;
    }
    values.push(result.value);
  }
}

export async function breakStream(s) {
  for await (const value of s) {
    return value;
  }
  throw new Error('component stream ended before yielding an item');
}

export async function returnStream(s) {
  const iterator = s[Symbol.asyncIterator]();
  const first = await iterator.next();
  const closed = await iterator.return();
  return `${first.value}|${closed.done}|${closed.value === undefined}`;
}

export async function throwStream(s) {
  const iterator = s[Symbol.asyncIterator]();
  const first = await iterator.next();
  try {
    await iterator.throw(new Error('consumer-stop'));
    return 'throw-resolved';
  } catch (error) {
    return `${first.value}|${error.message}`;
  }
}

export async function closePendingStream(s) {
  const pending = s[Symbol.asyncIterator]().next();
  await new Promise(resolve => setTimeout(resolve, 1));

  const closed = await s[Symbol.asyncIterator]().return('closed');
  const pendingResult = await pending;
  const closedAgain = await s[Symbol.asyncIterator]().return('closed-again');
  const nextAfterClose = await s[Symbol.asyncIterator]().next();

  return [
    closed.done,
    closed.value,
    pendingResult.done,
    pendingResult.value === undefined,
    closedAgain.done,
    closedAgain.value,
    nextAfterClose.done,
    nextAfterClose.value === undefined,
  ].join('|');
}

export async function runNestedObservedStream(cleanupFailure) {
  let nextValue = 0;
  const stdout = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          nextValue += 1;
          return { done: false, value: nextValue };
        },
        async return() {
          await new Promise(resolve => setTimeout(resolve, 1));
          observer.cleanupComplete();
          if (cleanupFailure) {
            throw new Error('nested-cleanup-failed');
          }
          return { done: true, value: undefined };
        },
      };
    },
  };

  return {
    label: 'nested-observed',
    futureValue: Promise.resolve(1),
    stdout,
    stderr: null,
  };
}

let observedStreamState;

export async function runObservedStream() {
  let resolveCleanup;
  const cleanupCompleted = new Promise(resolve => { resolveCleanup = resolve; });
  observedStreamState = {
    nextCalls: 0,
    returnStarted: 0,
    returnFinished: 0,
    cleanupCompleted,
  };

  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          observedStreamState.nextCalls += 1;
          return { done: false, value: observedStreamState.nextCalls };
        },
        async return() {
          observedStreamState.returnStarted += 1;
          await Promise.resolve();
          observedStreamState.returnFinished += 1;
          resolveCleanup();
          return { done: true, value: undefined };
        },
      };
    },
  };
}

export async function readObservedStreamState() {
  await Promise.race([
    observedStreamState.cleanupCompleted,
    new Promise(resolve => setTimeout(resolve, 1000)),
  ]);
  return `${observedStreamState.nextCalls}|${observedStreamState.returnStarted}|${observedStreamState.returnFinished}`;
}
