import * as host from 'test:async-io/host';

export async function run(ms) {
  // Call the async host import and await its promise, then transform the result.
  const delayed = await host.hostDelay(ms);
  return delayed + 1;
}
