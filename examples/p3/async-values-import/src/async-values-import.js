import * as host from 'test:async-values-import/host';

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
