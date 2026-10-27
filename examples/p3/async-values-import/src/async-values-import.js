import * as host from 'test:async-values-import/host';

export async function runBufferTransfer() {
  const bytes = Uint8Array.from({ length: 16384 }, (_, i) => i & 255);
  const pending = host.echoBytes(bytes);
  bytes.fill(0);
  const transferred = bytes.buffer.transfer();
  new Uint8Array(transferred).fill(255);
  const echoed = await pending;
  if (echoed.length !== 16384 || !echoed.every((byte, i) => byte === (i & 255))) {
    throw new Error('native async import did not retain its input bytes');
  }
  try {
    await host.echoBytes(bytes);
    throw new Error('detached input was accepted');
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
  }
  return true;
}

const importCheckpointReason = new Error('async import checkpoint');
let importCheckpointCount = 0;
process.on('unhandledRejection', (reason) => {
  if (reason === importCheckpointReason) importCheckpointCount += 1;
});

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

// The raw future export returns before this continuation runs. Resolving the imported future must
// checkpoint the rejection created by the continuation before the host can call back into JS.
export async function runImportCheckpointFuture() {
  const value = await host.consumeFuture(Promise.resolve(9));
  Promise.reject(importCheckpointReason);
  return value;
}

export function readImportCheckpointCount() {
  return importCheckpointCount;
}

export async function runNestedImports() {
  const { runJavaScript, startJavaScript } = await import('wasm-rquickjs:execution');
  const results = [];
  for (let i = 0; i < 3; i++) {
    const result = await runJavaScript({
      source: `
        const host = await import('test:async-values-import/host');
        const future = await host.consumeFuture(Promise.resolve(${17 + i}));
        const stream = await host.consumeStream([2, 3, ${7 + i}]);
        const checked = await host.checkFuture(Promise.resolve(${23 + i}));
        let error;
        try {
          await host.checkFuture(Promise.resolve(13));
        } catch (caught) {
          error = caught;
        }
        return { future, stream, checked, error };
      `,
    });
    results.push(result.value);
  }

  const pendingSource = `
    const host = await import('test:async-values-import/host');
    const pending = host.delayedFuture(Promise.resolve(41));
    console.log('pending');
    return await pending;
  `;
  let timedOut = false;
  try {
    await runJavaScript({ source: pendingSource, timeoutMs: 20 });
  } catch (error) {
    timedOut = String(error).includes('timed out');
  }
  const job = startJavaScript({ source: pendingSource });
  await new Promise(resolve => job.stdout.once('data', resolve));
  job.cancel();
  let cancelled = false;
  try {
    await job.result;
  } catch (error) {
    cancelled = String(error).includes('cancelled');
  }
  // Let both native imports finish after their child runtimes have been destroyed.
  await new Promise(resolve => setTimeout(resolve, 150));
  const control = await host.consumeFuture(Promise.resolve(53));
  return JSON.stringify({ results, timedOut, cancelled, control });
}
