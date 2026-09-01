import * as host from 'test:async-values-import/host';

export async function run() {
  // Import returning a `future<u32>`, exposed to JS as a `Promise<u32>`.
  const a = await host.makeFuture(41);

  // Import returning a `stream<u8>`, exposed to JS as an async-iterable.
  const collected = [];
  for await (const x of host.makeStream(4)) {
    collected.push(x);
  }

  // Import taking a `future<u32>`: a JS promise is lowered into a component future.
  const b = await host.consumeFuture(Promise.resolve(7));

  // Import taking a `stream<u8>`: a JS async-iterable is lowered into a component stream.
  async function* gen() {
    yield 2;
    yield 3;
    yield 5;
  }
  const c = await host.consumeStream(gen());

  return `${a}|${collected.join(',')}|${b}|${c}`;
}

export async function runPromiseStreamItems() {
  // A JS sync iterable handed to a component stream should behave like `for await` over that
  // iterable, including awaiting promise-valued items produced by the sync iterator.
  const total = await host.consumeStream([
    Promise.resolve(2),
    Promise.resolve(3),
    Promise.resolve(5),
  ]);

  return String(total);
}

export async function runStoredFuture() {
  let release;
  const value = new Promise(resolve => { release = resolve; });

  await host.storeFuture(value);
  release(99);

  return String(await host.readStoredFuture());
}

function observedStream(sync = false) {
  let resolveCleanup;
  const cleanupCompleted = new Promise(resolve => { resolveCleanup = resolve; });
  const state = {
    nextCalls: 0,
    returnStarted: 0,
    returnFinished: 0,
    cleanupCompleted,
  };

  const iterator = {
    next() {
      state.nextCalls += 1;
      return { done: false, value: state.nextCalls };
    },
    async return() {
      state.returnStarted += 1;
      await Promise.resolve();
      state.returnFinished += 1;
      resolveCleanup();
      return { done: true, value: undefined };
    },
  };
  const source = sync
    ? { [Symbol.iterator]() { return iterator; } }
    : { [Symbol.asyncIterator]() { return iterator; } };

  return { source, state };
}

async function waitForCleanup(state) {
  await Promise.race([
    state.cleanupCompleted,
    new Promise(resolve => setTimeout(resolve, 1000)),
  ]);
}

export async function runStreamReadableDrop() {
  const { source, state } = observedStream();
  const first = await host.consumeStreamPrefix(source);
  await waitForCleanup(state);
  return `${first}|${state.nextCalls}|${state.returnStarted}|${state.returnFinished}`;
}

export async function runStreamBackpressure() {
  const { source, state } = observedStream(true);
  await host.consumeStreamWithBackpressure(source);
  await waitForCleanup(state);
  return `${state.nextCalls}|${state.returnStarted}|${state.returnFinished}`;
}

export async function runStreamFailure() {
  const source = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          await Promise.resolve();
          throw new Error('producer-failed');
        },
      };
    },
  };

  await host.consumeStream(source);
  return 'clean-eof';
}

export async function runStreamCleanupFailure() {
  let cleanupStarted;
  const cleanupStartedPromise = new Promise(resolve => { cleanupStarted = resolve; });
  const source = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          return { done: false, value: 1 };
        },
        async return() {
          cleanupStarted();
          await Promise.resolve();
          throw new Error('cleanup-failed');
        },
      };
    },
  };

  await host.consumeStreamPrefix(source);
  await Promise.race([
    cleanupStartedPromise,
    new Promise(resolve => setTimeout(resolve, 1000)),
  ]);
  await new Promise(resolve => setTimeout(resolve, 10));
  return 'clean-eof';
}

export async function runStreamConversionFailure() {
  let nextCalls = 0;
  const source = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          nextCalls += 1;
          return { done: false, value: 'not-a-u8' };
        },
        async return() {
          host.cleanupComplete();
          throw new Error('secondary-cleanup-failed');
        },
      };
    },
  };

  await host.consumeStream(source);
  return `clean-eof|${nextCalls}`;
}

export async function runSyncStreamPromiseRejection() {
  const source = {
    [Symbol.iterator]() {
      return {
        next() {
          return {
            done: false,
            value: Promise.reject(new Error('sync-item-failed')),
          };
        },
        return() {
          host.cleanupComplete();
          return { done: true, value: undefined };
        },
      };
    },
  };

  await host.consumeStream(source);
  return 'clean-eof';
}
