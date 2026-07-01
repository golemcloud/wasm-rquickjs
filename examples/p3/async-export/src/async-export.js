export async function run() {
  // Exercise the async path: yield to the microtask queue, then return.
  await Promise.resolve();
  return "hello from p3";
}

export async function add(a, b) {
  return a + b;
}
