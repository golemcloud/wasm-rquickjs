export async function run(flag) {
  // Yield once to exercise the async path, then return a `result<u32, string>`.
  await Promise.resolve();
  if (flag) {
    // `ok` arm: return the bare success value.
    return 7;
  }
  // `err` arm: throw the error value.
  throw "nope";
}
