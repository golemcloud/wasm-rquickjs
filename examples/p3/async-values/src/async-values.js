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
